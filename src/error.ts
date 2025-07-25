import { APIGatewayProxyResultV2 } from 'aws-lambda';

export class HTTPError extends Error {
    status: number;
    errorCode: string;
    msg?: string;

    constructor(status: number, errorCode: string, msg?: string) {
        super(`${status} ${errorCode}: ${msg}`);
        this.status = status;
        this.errorCode = errorCode;
        this.msg = msg;
    }

    intoAPIGatewayResult(): APIGatewayProxyResultV2 {
        return {
            statusCode: this.status,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: this.errorCode,
                message: this.msg ?? ''
            }),
        }
    }
}

export class InternalError extends HTTPError {
    constructor(message?: string) {
        super(500, 'internal-error', message);
    }
}

export class NotFoundError extends HTTPError {
    constructor(message?: string) {
        super(404, 'not-found', message);
    }
}

export class BadRequestError extends HTTPError {
    constructor(message?: string) {
        super(400, 'bad-request', message);
    }
}