export function httpResponseFormatter(defaultStatusCode = 200) {
    return {
        after: async (handler) => {
            const { data, headers = {} } = handler.response;
            if (!headers['Content-Type'] && !headers['content-type']) {
                headers['Content-Type'] = 'application/json';
            }
            if (!headers['Access-Control-Allow-Origin'] && !headers['access-control-allow-origin']) {
                headers['Access-Control-Allow-Origin'] = '*';
            }
            if (!headers['Access-Control-Expose-Headers'] && !headers['access-control-expose-headers']) {
                headers['Access-Control-Expose-Headers'] = 'Content-Range';
            }
            handler.response = {
                statusCode: defaultStatusCode,
                headers,
                body: JSON.stringify(data), // TODO: need return the same format each time, for example {}
            };
            console.log(handler.response);
        },
    };
}
