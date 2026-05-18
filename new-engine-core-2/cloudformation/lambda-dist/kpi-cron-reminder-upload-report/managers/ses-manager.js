import { readFileSync } from 'fs';

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

export default class ManagerSES {
    #client;
    #fromTo = process.env.FROM_TO;

    constructor(config = {}) {
        this.#client = new SESv2Client({ region: config.region, profile: config.profile });
    }

    async sendEmail(destinationEmail) {
        const reminderTemplate = readFileSync('templates/reminder.html', 'utf8');
        const input = {
            FromEmailAddress: this.#fromTo,
            Destination: {
                ToAddresses: [destinationEmail],
            },
            Content: {
                Simple: {
                    Subject: {
                        Data: 'Reminder: Submit Your Monthly Report by [1st of Next Month]',
                    },
                    Body: {
                        Html: {
                            Data: reminderTemplate,
                        },
                    },
                },
            },
        };

        const command = new SendEmailCommand(input);
        return this.#client.send(command);
    }

    async processingListEmails(listEmails) {
        for (const email of listEmails) {
            await this.sendEmail(email).catch((err) => console.error(err));
        }
    }
}
