export class AbstractF2Error extends Error {
    constructor(message) {
        super(message);
    }

    toJSON() {
        return {
            status: this.code,
            message: this.message,
        };
    }
}
