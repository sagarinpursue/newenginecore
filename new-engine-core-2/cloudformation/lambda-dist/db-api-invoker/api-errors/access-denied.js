import { AbstractF2Error } from './abstract-f2-error.js';
export class AccessDeniedError extends AbstractF2Error {
    code = 403;
    constructor(message = 'Access denied. You do not have permission to perform this action.') {
        super(message);
        this.name = 'AccessDeniedError';
    }
}
