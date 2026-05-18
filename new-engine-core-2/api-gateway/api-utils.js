const ERROR_CODES = [400, 401, 403, 404, 409, 500];
const DEFAULT_RESPONSE_TEMPLATE = `
    #set($inputRoot = $input.path('$'))
    #if($inputRoot.toString().contains("errorMessage"))
        #set($context.responseOverride.status = 500)
        {"error" : "Internal Server Error"}
    #else
        $input.json("$")
    #end
`;
const ERROR_RESPONSE_TEMPLATE = `
    #set ($errorMessageObj = $util.parseJson($input.path('$.errorMessage')))
    { "message" : "$errorMessageObj.message", "error" : "$errorMessageObj.error" }
`;
const REQUEST_TEMPLATE = `{
    "body" : $input.json('$'),
    "headers": {
        #foreach($header in $input.params().header.keySet())
            "$header": "$util.escapeJavaScript($input.params().header.get($header))" #if($foreach.hasNext),#end
        #end
    },
    "method": "$context.httpMethod",
    "path": "$context.path",
    "params": {
        #foreach($param in $input.params().path.keySet())
            "$param": "$util.escapeJavaScript($util.urlDecode($input.params().path.get($param)))" #if($foreach.hasNext),#end
        #end
    },
    "query": {
        #foreach($queryParam in $input.params().querystring.keySet())
            "$queryParam": "$util.escapeJavaScript($input.params().querystring.get($queryParam))" #if($foreach.hasNext),#end
        #end
    },
    "authorizer":{
        "claims": {
            "sub":"$context.authorizer.claims.sub",
            "username":"$context.authorizer.claims["cognito:username"]",
            "email":"$context.authorizer.claims.email"
        },
        "user":"$util.escapeJavaScript($context.authorizer.user)",
        "llmStructureId":"$util.escapeJavaScript($context.authorizer.llmStructureId)"
    }
}`;

function buildResponse(code) {
    return {
        [code]: {
            description: `${code} response`,
            schema: {
                $ref: '#/definitions/Empty',
            },
            headers: {
                'Access-Control-Allow-Origin': {
                    type: 'string',
                },
                version: {
                    type: 'string',
                },
                'Access-Control-Expose-Headers': {
                    type: 'string',
                },
            },
        },
    };
}
function buildIntegrationResponse(code) {
    const responsePattern = code === 200 ? 'default' : `.*"status":${code}.*`;

    const responseTemplate = code === 200 ? DEFAULT_RESPONSE_TEMPLATE : ERROR_RESPONSE_TEMPLATE;

    return {
        [responsePattern]: {
            statusCode: code.toString(),
            responseParameters: {
                'method.response.header.version': 'stageVariables.version',
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Expose-Headers': "'version'",
            },
            responseTemplates: {
                'application/json': responseTemplate,
            },
        },
    };
}
export const buildEndpointConfig = ({ method, lambda, region, accountId, invokeLambdaRole, auth }) => {
    const responses = Object.assign({}, buildResponse(200), ...ERROR_CODES.map(buildResponse));

    const integrationResponses = Object.assign({}, buildIntegrationResponse(200), ...ERROR_CODES.map(buildIntegrationResponse));

    return {
        [method.toLowerCase()]: {
            consumes: ['application/json'],
            produces: ['application/json'],
            responses,
            security: auth?.map((authItem) => ({ [authItem]: [] })) || [],
            'x-amazon-apigateway-integration': {
                credentials: `arn:aws:iam::${accountId}:role/${invokeLambdaRole}`,
                uri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${region}:${accountId}:function:${lambda}/invocations`,
                responses: integrationResponses,
                passthroughBehavior: 'when_no_templates',
                httpMethod: 'POST',
                requestTemplates: {
                    'application/json': REQUEST_TEMPLATE,
                },
                contentHandling: 'CONVERT_TO_TEXT',
                type: 'aws',
            },
        },
    };
};
export const buildProxyEndpointConfig = ({ method, lambda, region, accountId, invokeLambdaRole, auth }) => {
    return {
        [method.toLowerCase()]: {
            security: auth?.map((authItem) => ({ [authItem]: [] })) || [],
            'x-amazon-apigateway-integration': {
                credentials: `arn:aws:iam::${accountId}:role/${invokeLambdaRole}`,
                uri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${region}:${accountId}:function:${lambda}/invocations`,
                httpMethod: 'POST',
                type: 'aws_proxy',
            },
        },
    };
};
export const buildOptionsConfig = () => {
    return {
        options: {
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: {
                200: {
                    description: '200 response',
                    schema: {
                        $ref: '#/definitions/Empty',
                    },
                    headers: {
                        'Access-Control-Allow-Origin': {
                            type: 'string',
                        },
                        'Access-Control-Allow-Methods': {
                            type: 'string',
                        },
                        'Access-Control-Allow-Headers': {
                            type: 'string',
                        },
                    },
                },
            },
            'x-amazon-apigateway-integration': {
                responses: {
                    default: {
                        statusCode: '200',
                        responseParameters: {
                            'method.response.header.Access-Control-Allow-Methods': `'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'`,
                            'method.response.header.Access-Control-Allow-Headers':
                                "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-Target,ApiKey,apikey,Prefer,X-Shared-Token'",
                            'method.response.header.Access-Control-Allow-Origin': "'*'",
                        },
                    },
                },
                passthroughBehavior: 'when_no_match',
                requestTemplates: {
                    'application/json': JSON.stringify({ statusCode: 200 }),
                },
                type: 'mock',
            },
        },
    };
};
