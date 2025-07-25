import middy from "@middy/core";
import { ddbClient } from "../../lib/ddb-client";
import { extractor, ExtractorOutput } from "../../middleware/extractor";
import { PostItem } from "../../model/post";
import { Pagination, PaginationResult } from "../../schemas";
import { PostStore } from "../../store/post-store";
import { errorHandler } from "../../middleware/error-handler";


const postStore = new PostStore(ddbClient);

const extractorInput = {
    query: Pagination,
};

async function lambdaHandler({ query }: ExtractorOutput<typeof extractorInput>): Promise<PaginationResult<PostItem>> {
    return await postStore.listPosts(query);
};

export const handler = middy()
    .use(errorHandler())
    .use(extractor(extractorInput))
    .handler(lambdaHandler);