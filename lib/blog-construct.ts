import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { AttributeType, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

type RouteConfig = {
    method: HttpMethod;
    path: string;
    handlerFile: string;
    name: string;
    authorizer?: boolean
};

export class Blog extends Construct {
    public readonly api: HttpApi;
    public readonly dynamodbTable: TableV2;

    constructor(scope: Construct, id: string, authorizer: HttpUserPoolAuthorizer) {
        super(scope, id);

        this.api = new HttpApi(this, 'BlogApi', {
            disableExecuteApiEndpoint: true,
        });
        this.dynamodbTable = new TableV2(this, 'BlogTable', {
            partitionKey: { name: 'pk', type: AttributeType.STRING },
            sortKey: { name: 'sk', type: AttributeType.STRING },
            globalSecondaryIndexes: [
                {
                    indexName: "GSI1",
                    partitionKey: { name: 'entity', type: AttributeType.STRING },
                    sortKey: { name: 'postId', type: AttributeType.STRING },
                }
            ]
        });

        const routesConfig: RouteConfig[] = [
            { method: HttpMethod.GET, path: '/me/posts/{postId}', handlerFile: '/me/posts/get.ts', name: 'GetMyPost', authorizer: true },
            { method: HttpMethod.GET, path: '/me/posts', handlerFile: '/me/posts/list.ts', name: 'ListMyPosts', authorizer: true },
            { method: HttpMethod.POST, path: '/me/posts', handlerFile: '/me/posts/create.ts', name: 'CreatePost', authorizer: true },
            { method: HttpMethod.DELETE, path: '/me/posts/{postId}', handlerFile: '/me/posts/delete.ts', name: 'DeletePost', authorizer: true },
            { method: HttpMethod.GET, path: '/posts/{postId}', handlerFile: '/posts/get.ts', name: 'GetPost' },
            { method: HttpMethod.GET, path: '/posts', handlerFile: '/posts/list.ts', name: 'ListPosts' },
        ];

        for (const route of routesConfig) {
            const lambda = new NodejsFunction(this, `${route.name}Lambda`, {
                entry: `./src/api/${route.handlerFile}`,
                runtime: Runtime.NODEJS_22_X,
                environment: {
                    POST_TABLE: this.dynamodbTable.tableName,
                }
            });
            this.dynamodbTable.grantReadWriteData(lambda);

            this.api.addRoutes({
                path: route.path,
                methods: [route.method],
                integration: new HttpLambdaIntegration(`${route.name}Integration`, lambda),
                authorizer: route.authorizer === true ? authorizer : undefined
            });
        }
    }
}