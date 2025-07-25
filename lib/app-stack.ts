import { Construct } from 'constructs';
import { Blog } from './blog-construct';
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { ApiMapping, DomainName } from 'aws-cdk-lib/aws-apigatewayv2';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayv2DomainProperties } from 'aws-cdk-lib/aws-route53-targets';
import { UserPool, UserPoolClientIdentityProvider } from 'aws-cdk-lib/aws-cognito';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';

const zoneName = '';
const apiDomainName = `api.${zoneName}`;

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const hostedZone = HostedZone.fromLookup(this, 'HostZone', {
      domainName: zoneName
    });
    const apiCert = new Certificate(this, 'Certificate', {
      domainName: apiDomainName,
      validation: CertificateValidation.fromDns(hostedZone),
    });
    const apiDomain = new DomainName(this, 'Domain', {
      domainName: apiDomainName,
      certificate: apiCert
    });

    new ARecord(this, 'ApiARecord', {
      zone: hostedZone,
      target: RecordTarget.fromAlias(new ApiGatewayv2DomainProperties(
        apiDomain.regionalDomainName,
        apiDomain.regionalHostedZoneId
      )),
      recordName: 'api'
    });


    const userPool = new UserPool(this, 'AppUserPool', {
      removalPolicy: RemovalPolicy.DESTROY,
      passwordPolicy: {
        requireDigits: false,
        requireLowercase: false,
        requireSymbols: false,
        requireUppercase: false
      }
    });
    const appClient = userPool.addClient("AppClient", {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO]
    });
    const authorizer = new HttpUserPoolAuthorizer('Authorizer', userPool, {
      userPoolClients: [appClient],
    });

    const blog = new Blog(this, 'BlogConstruct', authorizer);

    const blogStage = blog.api.addStage("BlogStage", {
      autoDeploy: true,
      stageName: 'prod'
    });

    new ApiMapping(this, 'BlogApiMapping', {
      api: blog.api,
      domainName: apiDomain,
      stage: blogStage,
      apiMappingKey: 'blog'
    });
  }
}
