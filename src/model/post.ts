import * as z from 'zod';

export const Post = z.object({
    title: z.string(),
    summary: z.string(),
    content: z.string(),
    tags: z.array(z.string()),
});
export type Post = z.infer<typeof Post>;

export const PostItem = z.object({
    ...Post.shape,
    userId: z.string(),
    postId: z.string(),
    createdAt: z.string(),
})
export type PostItem = z.infer<typeof PostItem>;