import middy from '@middy/core';
import { HTTPError, InternalError } from '../error';

export function errorHandler() {
    const onError: middy.MiddlewareFn<unknown, unknown> = async (
        request
    ): Promise<void> => {
        if (request.error instanceof HTTPError) {
            request.response = request.error.intoAPIGatewayResult();
        } else {
            const error = new InternalError(request.error?.message ?? 'unknown, error is null');
            request.error = error;
            request.response = error.intoAPIGatewayResult();
        }
    }

    return {
        onError,
    }
}