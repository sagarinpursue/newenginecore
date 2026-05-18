import { AbstractF2Error } from './abstract-f2-error.js';

export class UnknownError extends AbstractF2Error {
    code = 500;
    constructor() {
        super('An error occurred. Please try again or contact support if the problem persists');
        this.name = 'UnknownError';
    }
}
