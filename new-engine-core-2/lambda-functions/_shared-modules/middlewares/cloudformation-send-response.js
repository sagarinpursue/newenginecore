export const cloudformationSendResponse = () => {
    const after = async (request) => {
        const responseBody = JSON.stringify({
            PhysicalResourceId: `resource-${request.event.LogicalResourceId}`,
            ...request.response,
        });
        const responseUrl = request.event.ResponseURL;
        if (!responseUrl) return request.response;
        console.log('Sending response to CloudFormation:', responseBody);
        try {
            const response = await fetch(responseUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': '',
                    'Content-Length': Buffer.byteLength(responseBody).toString(),
                },
                body: responseBody,
            });

            console.log(`CloudFormation response status: ${response.status}`);
        } catch (err) {
            console.error('Error sending response to CloudFormation:', err);
            throw err;
        }
    };

    return {
        after: after,
        onError: after,
    };
};
