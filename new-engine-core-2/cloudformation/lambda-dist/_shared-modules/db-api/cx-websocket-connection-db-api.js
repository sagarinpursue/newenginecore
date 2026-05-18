import axios from 'axios';

export default class CxWebSocketConnectionDbApi {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async get(sessionId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/websocket_connections`, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
            params: {
                select: 'connectionId:connection_id',
                session_id: `eq.${sessionId}`,
                expires_at: `gt.${new Date().toISOString()}`,
            },
        });

        return data;
    }

    // async getExpired() {
    //     const { data } = await axios.get(`${this.#apiUrl}/rest/v1/websocket_connections`, {
    //         headers: {
    //             Authorization: this.#token,
    //             apikey: this.#apiKey,
    //         },
    //         params: {
    //             select: 'connectionId:connection_id',
    //             expires_at: `lt.${new Date().toISOString()}`,
    //         },
    //     });
    //
    //     return data;
    // }

    async connect(sessionId, connectionId) {
        const body = {
            connection_id: connectionId,
            session_id: sessionId,
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1h
        };

        await axios.post(`${this.#apiUrl}/rest/v1/websocket_connections`, body, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.#token,
                apikey: this.#apiKey,
                Prefer: 'resolution=merge-duplicates',
            },
        });
    }

    async extend(connectionId) {
        const body = {
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1h
        };

        await axios.patch(`${this.#apiUrl}/rest/v1/websocket_connections`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
            params: {
                connection_id: `eq.${connectionId}`,
            },
        });
    }

    async disconnect(connectionId) {
        await axios.delete(`${this.#apiUrl}/rest/v1/websocket_connections`, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
            params: {
                connection_id: `eq.${connectionId}`,
            },
        });
    }

    async removeExpired() {
        const { headers } = await axios.delete(`${this.#apiUrl}/rest/v1/websocket_connections`, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
                Prefer: 'count=exact',
            },
            params: {
                expires_at: `lt.${new Date().toISOString()}`,
                // connection_id: `in.(${connectionIds.join(',')})`, // [IM] Plan B
            },
        });

        console.log(headers);

        return headers['content-range'] ? Number(headers['content-range'].split('/')[1]) : 0;
    }
}
