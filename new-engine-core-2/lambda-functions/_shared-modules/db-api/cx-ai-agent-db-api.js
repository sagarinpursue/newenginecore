import axios from 'axios';

export default class CxAiAgentDbApi {
    #apiUrl;
    #apiKey;
    #token;

    constructor(apiUrl, apiKey, token) {
        this.#apiUrl = apiUrl;
        this.#apiKey = apiKey;
        this.#token = token;
    }

    async create(data) {
        console.log('CxAiAgentDbApi -> create -> data:', data);
        const body = {
            ai_agent_id: data.aiAgentId,
            agent_id: data.agentId,
            agent_alias_id: data.agentAliasId,
            name: data.name,

            is_imported: data.isImported,

            user_id: data.userId,
            account_id: data.accountId,
        };
        console.log('CxAiAgentDbApi -> create -> body:', body);
        await axios.post(`${this.#apiUrl}/rest/v1/ai_agents`, body, {
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }

    async update(data) {
        console.log('CxAiAgentDbApi -> update -> data:', data);
        const body = {
            name: data.name,
        };
        console.log('CxAiAgentDbApi -> create -> body:', body);
        await axios.patch(`${this.#apiUrl}/rest/v1/ai_agents`, body, {
            params: {
                ai_agent_id: `eq.${data.aiAgentId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
    }

    async get(aiAgentId) {
        console.log('CxAiAgentDbApi -> get -> aiAgentId:', aiAgentId);
        const { data } = await axios.get(`${this.#apiUrl}/rest/v1/ai_agents`, {
            params: {
                ai_agent_id: `eq.${aiAgentId}`,
            },
            headers: {
                Authorization: this.#token,
                apikey: this.#apiKey,
            },
        });
        return data[0]
            ? {
                  aiAgentId: data[0].ai_agent_id,
                  agentId: data[0].agent_id,
                  agentAliasId: data[0].agent_alias_id,
                  name: data[0].name,
              }
            : null;
    }
}
