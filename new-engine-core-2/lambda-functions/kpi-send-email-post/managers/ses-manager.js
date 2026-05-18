import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

export default class ManagerSES {
    #client;
    #fromTo = process.env.FROM_TO;

    constructor(config = {}) {
        this.#client = new SESv2Client({ region: config.region, profile: config.profile });
    }

    async sendEmail(destinationEmail, template) {
        const input = {
            FromEmailAddress: this.#fromTo,
            Destination: {
                ToAddresses: [destinationEmail],
            },
            Content: {
                Simple: {
                    Subject: {
                        Data: 'Reminder: Notifications for Missing Services',
                    },
                    Body: {
                        Html: {
                            Data: template,
                        },
                    },
                },
            },
        };

        const command = new SendEmailCommand(input);
        return this.#client.send(command);
    }

    async processingListEmails(listEmails, template) {
        for (const email of listEmails) {
            await this.sendEmail(email, template).catch((err) => console.error(err));
        }
    }
}
