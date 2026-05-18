import axios from 'axios';
import dayjs from 'dayjs';

const DB_API_URL = process.env.DB_API_URL;

export default class AccountsDB {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async getListByNotLoadedReports() {
        const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD');
        const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD');

        const params = new URLSearchParams();
        params.set('select', '*,orders()');
        params.set('orders', 'is.null');
        params.append('orders.submission_date', `gte.${startOfMonth}`);
        params.append('orders.submission_date', `lt.${endOfMonth}`);
        params.append('account_id', 'neq.00000000-0000-0000-0000-000000000000');

        console.log('search params :>> ', params.toString());

        const { data } = await axios.get(`${DB_API_URL}/rest/v1/accounts`, {
            params: params,
            headers: {
                apikey: this.apiKey,
                Authorization: `Bearer ${this.apiKey}`,
            },
        });
        return data;
    }
}
