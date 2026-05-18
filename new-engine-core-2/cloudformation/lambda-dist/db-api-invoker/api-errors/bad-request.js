import { AbstractF2Error } from './abstract-f2-error.js';

export class BadRequestError extends AbstractF2Error {
    code = 400;
    constructor(message = 'The data provided does not meet the required conditions. Please review your input and try again.') {
        super(message);
        this.name = 'BadRequestError';
    }
}
