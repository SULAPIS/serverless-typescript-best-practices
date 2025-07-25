import * as z from 'zod';
import { decodeToken } from './lib/pagination-transform';
export const PostId = z.object({
    postId: z.string()
});
export type PostId = z.infer<typeof PostId>;
export const Pagination = z.object({
    limit: z.string().transform(Number).refine((n) => !isNaN(n), { message: "limit must be a number" }).default(20),
    nextToken: z.string().transform(decodeToken).optional()
});
export type Pagination = z.infer<typeof Pagination>;
export type PaginationResult<T> = {
    items: T[];
    nextToken?: string;
};
