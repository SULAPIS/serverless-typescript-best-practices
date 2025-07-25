import middy from '@middy/core';
import { errorHandler } from '../../../middleware/error-handler';
import { extractor, ExtractorOutput } from '../../../middleware/extractor';
import { PostStore } from '../../../store/post-store';
import { ddbClient } from '../../../lib/ddb-client';
import { PostId } from '../../../schemas';
import { PostItem } from '../../../model/post';
import { extractUserId, UserId } from '../../../middleware/extract-userid';

const postStore = new PostStore(ddbClient);

const extractorInput = {
    params: PostId
};

async function lambdaHandler({ params, userId }: ExtractorOutput<typeof extractorInput> & UserId): Promise<PostItem> {
    return await postStore.getUserPost(userId, params.postId);
};

export const handler = middy()
    .use(errorHandler())
    .use(extractUserId())
    .use(extractor(extractorInput))
    .handler(lambdaHandler);