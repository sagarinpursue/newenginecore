export default class UserDbApi {
    static async getMe(clientDB) {
        const { data } = await clientDB.get(`/auth/v1/user`);
        return data;
    }
}
