import * as z from 'zod';
import middy from '@middy/core';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { BadRequestError } from '../error';

export type ExtractorInput = {
    body?: z.ZodType,
    params?: z.ZodType,
    query?: z.ZodType
};
export type ExtractorOutput<T> = {
    [K in keyof T as T[K] extends undefined ? never : K]: z.output<T[K]>
};
export type ExtractorEvent<T extends ExtractorInput> = Omit<APIGatewayProxyEventV2, 'body'> & ExtractorOutput<T>;

export function extractor<T extends ExtractorInput>(input: T) {
    const before: middy.MiddlewareFn<ExtractorEvent<T>, unknown> = async (
        request
    ): Promise<void> => {
        const event = request.event as APIGatewayProxyEventV2;
        const output: Record<string, unknown> = {};

        try {
            if (input.body !== undefined) {
                const body = input.body.parse(JSON.parse(event.body ?? '{}'));
                output['body'] = body;
            }
            if (input.params !== undefined) {
                const params = input.params.parse(event.pathParameters ?? {});
                output['params'] = params;
            }
            if (input.query !== undefined) {
                const query = input.query.parse(event.queryStringParameters ?? {});
                output['query'] = query;
            }

            Object.assign(request.event, output);
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new BadRequestError(JSON.stringify(z.treeifyError(error)))
            }
        }
    }

    return {
        before,
    }
}