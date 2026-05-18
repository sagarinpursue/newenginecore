import { readFile } from 'fs/promises';

import axios from 'axios';
import dayjs from 'dayjs';

import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import inputOutputLogger from '@middy/input-output-logger';
import secretsManager from '@middy/secrets-manager';
import validator from '@middy/validator';

import Ajv from 'ajv'; // Create AJV instance and configure it with ajv-errors and ajv-formats
import ajvErrors from 'ajv-errors';
import 'dayjs/locale/ar.js'; // TODO: Set locale for Arabic language.
dayjs.locale('ar');

import { httpErrorFormatter, httpResponseFormatter } from '@shared-modules/f2-middlewares';

import ReportDbApi from './data/report-db-api.js';
import UserDbApi from './data/user-db-api.js';
import ManagerSES from './managers/ses-manager.js';
const ajv = new Ajv({ coerceTypes: 'number', strictTypes: false, allowUnionTypes: true, allErrors: true });
ajvErrors(ajv);
import { eventSchema } from './schemas/event.js';

const JWT_AUTHORIZER_SECRET = process.env.JWT_AUTHORIZER_SECRET;

const lambdaHandler = async (event, context) => {
    const API = axios.create({
        baseURL: process.env.DB_API_URL,
        headers: { apikey: context.jwtAuth.anonKey },
    });

    try {
        API.defaults.headers.common['Authorization'] = event.headers.Authorization;
        const authUser = await UserDbApi.getMe(API);
        console.log('authUser :>> ', authUser.email);

        const prepareTemplate = await toPrepareTemplate(API, event.body);
        const managerSES = new ManagerSES();
        await managerSES.sendEmail(authUser.email, prepareTemplate).catch((err) => console.error(err));

        // TODO: Send email to test
        // await managerSES.sendEmail('artem.strogalev+ses@2lemetry.io', prepareTemplate).catch((err) => console.error(err));
    } catch (error) {
        console.error(error.message);
        throw error;
    }
    return { data: 'Success' };
};

const toPrepareTemplate = async (API, eventBody) => {
    const { notificationType } = eventBody;

    switch (notificationType) {
        case 'reminderMissedServices': {
            const notificationTemplate = await readFile('templates/reminder-missed-services.html', 'utf8');

            const { reportId } = eventBody;
            const report = await ReportDbApi.getById(API, reportId);
            console.log('report :>> ', report);

            if (!report.system_note) {
                console.log('Not needed send email');
                return '';
            }
            report.systemNote = JSON.parse(report.system_note);

            return notificationTemplate
                .replace('{{REPORT_DATE}}', dayjs(report.created_at).format('MMM YYYY'))
                .replace('{{MISSED_SERVICES}}', report.systemNote.map((note) => `${note.code} - ${note.name}`).join('</li><li>'));
        }
        default:
            throw new Error('Unknown notification type');
    }
};

export const handler = middy()
    .use([
        inputOutputLogger(),
        httpJsonBodyParser({
            disableContentTypeError: true,
        }),
        secretsManager({
            fetchData: {
                jwtAuth: JWT_AUTHORIZER_SECRET,
            },
            disablePrefetch: true,
            setToContext: true,
        }),
        validator({ eventSchema: ajv.compile(eventSchema) }),

        httpResponseFormatter(),
        httpErrorFormatter(),
    ])
    .handler(lambdaHandler);
