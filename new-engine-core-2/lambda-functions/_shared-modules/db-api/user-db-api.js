import axios from 'axios';

export default class UserDbApi {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token || `Bearer ${this.#apiKey}`; // TODO: If no token provided, use provided apiKey for (Service Role)
    }

    async getMe() {
        const { data } = await axios.get(`${this.#apiUrl}/auth/v1/user`, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
        return data.id;
    }

    async getAccountId(userId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/user_refs`, {
            params: {
                user_id: `eq.${userId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
        return data[0]?.user_account_id;
    }

    async deleteUser(userId) {
        return await axios.delete(`${this.#apiUrl}/auth/v1/admin/users/${userId}`, {
            headers: {
                Authorization: `Bearer ${this.#apiKey}`, // Service key
                apikey: this.#apiKey,
            },
        });
    }

    async getUserRole(userId) {
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/user_refs`, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
            params: {
                user_id: `eq.${userId}`,
            },
        });

        return data[0]?.user_role;
    }

    async createUser(updateData) {
        const { data } = await axios.post(
            `${this.#apiUrl}/auth/v1/admin/users`,
            {
                email: updateData.email,
                password: updateData.password,
                email_confirm: true,
            },
            {
                headers: {
                    Authorization: this.#token,
                    apikey: this.#apiKey,
                },
            }
        );
        await axios.post(
            `${this.#apiUrl}/rest/v1/user_refs`,
            {
                user_id: data.id,
                user_account_id: updateData.accountId,
                user_name: updateData.email,
                user_role: updateData.role,
            },
            {
                headers: {
                    Authorization: this.#token,
                    apikey: this.#apiKey,
                    Prefer: 'resolution=merge-duplicates',
                },
            }
        );

        return data.id;
    }
}
