import middy from '@middy/core';
import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';

export type UserId = {
    userId: string
};

export function extractUserId() {
    const before: middy.MiddlewareFn<APIGatewayProxyEventV2WithJWTAuthorizer & UserId, unknown> = async (
        request
    ): Promise<void> => {
        const userId = request.event.requestContext.authorizer?.jwt.claims["sub"].toString()
        request.event['userId'] = userId;
    }
    return {
        before,
    }
}