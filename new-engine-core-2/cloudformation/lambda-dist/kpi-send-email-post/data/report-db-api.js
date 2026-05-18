export default class ReportDbApi {
    static async getById(client, reportId) {
        const params = new URLSearchParams();
        params.set('select', '*');
        params.append('report_id', `eq.${reportId}`);

        console.log('search params :>> ', params.toString());

        const { data } = await client.get(`/rest/v1/reports`, {
            params: params,
        });

        if (data.length === 0) {
            throw new Error('Report not found');
        }

        return data[0];
    }
}
