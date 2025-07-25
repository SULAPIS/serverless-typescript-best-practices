import * as z from 'zod';
import { v7 as uuidv7 } from 'uuid';
import { InternalError, NotFoundError } from '../error';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Post, PostItem } from '../model/post';
import { Pagination, PaginationResult } from '../schemas';
import { encodeToken } from '../lib/pagination-transform';

export class PostStore {
    private tableName: string;
    private ddbClient: DynamoDBDocumentClient

    constructor(client: DynamoDBDocumentClient) {
        if (process.env.POST_TABLE === undefined) {
            throw new InternalError('POST_TABLE not defined');
        }
        this.tableName = process.env.POST_TABLE;
        this.ddbClient = client;
    }

    async getPost(postId: string): Promise<PostItem> {
        const params = new QueryCommand({
            TableName: this.tableName,
            IndexName: 'GSI1',
            KeyConditionExpression: 'entity = :entity AND postId = :postId',
            ExpressionAttributeValues: {
                ':entity': 'post',
                ':postId': postId
            },
            Limit: 1
        });

        const item = (await this.ddbClient.send(params)).Items?.pop();
        if (item === undefined) throw new NotFoundError();

        return PostItem.parse(item);
    }

    async getUserPost(userId: string, postId: string): Promise<PostItem> {
        const params = new GetCommand({
            TableName: this.tableName,
            Key: {
                pk: `user_${userId}`,
                sk: `post_${postId}`,
            }
        });

        const item = (await this.ddbClient.send(params)).Item;
        if (item === undefined) throw new NotFoundError();

        return PostItem.parse(item);
    }

    async createPost(userId: string, post: Post): Promise<PostItem> {
        const postId = uuidv7();
        const item = <PostItem>{
            ...post,
            userId,
            postId,
            createdAt: new Date().toISOString(),
        };
        const params = new PutCommand({
            TableName: this.tableName,
            Item: {
                ...item,
                pk: `user_${userId}`,
                sk: `post_${postId}`,
                entity: 'post',
            }
        });

        await this.ddbClient.send(params);
        return PostItem.parse(item);
    }

    async deletePost(userId: string, postId: string): Promise<void> {
        const params = new DeleteCommand({
            TableName: this.tableName,
            Key: {
                pk: `user_${userId}`,
                sk: `post_${postId}`,
            }
        });

        await this.ddbClient.send(params);
    }

    async listPosts(pagination: Pagination): Promise<PaginationResult<PostItem>> {
        const params = new QueryCommand({
            TableName: this.tableName,
            IndexName: 'GSI1',
            KeyConditionExpression: 'entity = :post',
            ExpressionAttributeValues: {
                ':post': 'post'
            },
            Limit: pagination.limit,
            ScanIndexForward: false,
            ExclusiveStartKey: pagination.nextToken
        });

        const response = await this.ddbClient.send(params);

        return {
            items: z.array(PostItem).parse(response.Items ?? []),
            nextToken: response.LastEvaluatedKey ? encodeToken(response.LastEvaluatedKey) : undefined
        }
    }

    async listUserPosts(userId: string, pagination: Pagination): Promise<PaginationResult<PostItem>> {
        const params = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'pk = :userPK',
            ExpressionAttributeValues: {
                ':userPK': `user_${userId}`
            },
            Limit: pagination.limit,
            ScanIndexForward: false,
            ExclusiveStartKey: pagination.nextToken
        });

        const response = await this.ddbClient.send(params);

        return {
            items: z.array(PostItem).parse(response.Items ?? []),
            nextToken: response.LastEvaluatedKey ? encodeToken(response.LastEvaluatedKey) : undefined
        }
    }
}