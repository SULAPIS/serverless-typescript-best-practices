import middy from "@middy/core";
import { ddbClient } from "../../lib/ddb-client";
import { errorHandler } from "../../middleware/error-handler";
import { extractor, ExtractorOutput } from "../../middleware/extractor";
import { PostItem } from "../../model/post";
import { PostId } from "../../schemas";
import { PostStore } from "../../store/post-store";

const postStore = new PostStore(ddbClient);

const extractorInput = {
    params: PostId
};

async function lambdaHandler({ params }: ExtractorOutput<typeof extractorInput>): Promise<PostItem> {
    return await postStore.getPost(params.postId);
};

export const handler = middy()
    .use(errorHandler())
    .use(extractor(extractorInput))
    .handler(lambdaHandler);