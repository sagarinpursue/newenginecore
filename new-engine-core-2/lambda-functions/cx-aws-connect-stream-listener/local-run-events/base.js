export default {
    Records: [
        {
            EventSource: '',
            EventVersion: '',
            EventSubscriptionArn: '',
            Sns: {
                Type: 'Notification',
                MessageId: '',
                TopicArn: '',
                Subject: null,
                Message:
                    '{"AbsoluteTime":"2025-02-25T14:38:58.852Z","Content":"Message from live agent","ContentType":"application/vnd.amazonaws.connect.event.participant.joined","Id":"54ff54c0-dfac-4d21-a66a-a8ea05dd6fa4","Type":"MESSAGE","ParticipantId":"3d1ec15b-980a-48d9-8a1d-cceedeb369a8","DisplayName":"Max","ParticipantRole":"AGENT","InitialContactId":"3423e503-7281-4d51-aa0e-7514063ee653","ContactId":"3423e503-7281-4d51-aa0e-7514063ee653"}',
                Timestamp: '2025-02-25T14:39:00.934Z',
                SignatureVersion: '1',
                Signature: '',
                SigningCertUrl: '',
                UnsubscribeUrl: '',
                MessageAttributes: {
                    InitialContactId: { Type: 'String', Value: '3423e503-7281-4d51-aa0e-7514063ee653' },
                    MessageVisibility: { Type: 'String', Value: 'ALL' },
                    Type: { Type: 'String', Value: 'MESSAGE' },
                    AccountId: { Type: 'String', Value: '' },
                    ContentType: { Type: 'String', Value: 'text/plain' },
                    InstanceId: { Type: 'String', Value: '' },
                    ContactId: { Type: 'String', Value: '3423e503-7281-4d51-aa0e-7514063ee653' },
                    ParticipantRole: { Type: 'String', Value: 'CUSTOMER' },
                },
            },
        },
    ],
};
