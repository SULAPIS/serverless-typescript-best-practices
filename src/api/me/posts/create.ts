import middy from '@middy/core';
import { errorHandler } from '../../../middleware/error-handler';
import { extractor, ExtractorOutput } from '../../../middleware/extractor';
import { Post, PostItem } from '../../../model/post';
import { PostStore } from '../../../store/post-store';
import { extractUserId, UserId } from '../../../middleware/extract-userid';
import { ddbClient } from '../../../lib/ddb-client';

const postStore = new PostStore(ddbClient);

const extractorInput = {
    body: Post
};

async function lambdaHandler({ body, userId }: ExtractorOutput<typeof extractorInput> & UserId): Promise<PostItem> {
    const newItem = await postStore.createPost(userId, body);

    return newItem;
};

export const handler = middy()
    .use(errorHandler())
    .use(extractUserId())
    .use(extractor(extractorInput))
    .handler(lambdaHandler);