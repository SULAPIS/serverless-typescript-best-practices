import middy from "@middy/core";
import { ddbClient } from "../../../lib/ddb-client";
import { extractor, ExtractorOutput } from "../../../middleware/extractor";
import { PostItem } from "../../../model/post";
import { Pagination, PaginationResult } from "../../../schemas";
import { PostStore } from "../../../store/post-store";
import { errorHandler } from "../../../middleware/error-handler";
import { extractUserId, UserId } from "../../../middleware/extract-userid";

const postStore = new PostStore(ddbClient);

const extractorInput = {
    query: Pagination,
};

async function lambdaHandler({ userId, query }: ExtractorOutput<typeof extractorInput> & UserId)
    : Promise<PaginationResult<PostItem>> {
    return await postStore.listUserPosts(userId, query);
};

export const handler = middy()
    .use(errorHandler())
    .use(extractUserId())
    .use(extractor(extractorInput))
    .handler(lambdaHandler);