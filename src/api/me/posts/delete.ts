import middy from '@middy/core';
import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { errorHandler } from '../../../middleware/error-handler';
import { extractUserId, UserId } from '../../../middleware/extract-userid';
import { extractor, ExtractorOutput } from '../../../middleware/extractor';
import { PostStore } from '../../../store/post-store';
import { ddbClient } from '../../../lib/ddb-client';
import { PostId } from '../../../schemas';

const postStore = new PostStore(ddbClient);

const extractorInput = {
    params: PostId
};

async function lambdaHandler({ params, userId }: ExtractorOutput<typeof extractorInput> & UserId): Promise<APIGatewayProxyResultV2> {
    await postStore.deletePost(userId, params.postId);

    return { statusCode: 204 };
};

export const handler = middy()
    .use(errorHandler())
    .use(extractUserId())
    .use(extractor(extractorInput))
    .handler(lambdaHandler);