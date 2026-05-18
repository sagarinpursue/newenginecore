import { AbstractF2Error } from './abstract-f2-error.js';

export class UnsupportedError extends AbstractF2Error {
    code = 404;
    constructor() {
        super('The requested route is not supported. Please check the URL or contact support for assistance.');
        this.name = 'UnsupportedError';
    }
}
