# F2 Swagger. API Definition

This directory contains the Swagger API definition for the f2 platform.

## Files

*   `swagger.json`: The OpenAPI 3.0.1 definition for the f2-api.
*   `index.html`: A simple HTML file to view the swagger UI.
  
## Scripts
* `update-swagger.js`: A script to update the `swagger.json` file by fetching the latest API definition from AWS API Gateway.
* `deploy-swagger.js`: A script to deploy the `swagger.json` and `index.html` files to an S3 bucket and invalidate the CloudFront distribution.
* `publish-swagger.js`: A script that runs `update-swagger.js` and `deploy-swagger.js` in sequence.

## Usage

To update the `swagger.json` file, run the following command:

```bash
node scripts/update-swagger.js
```

To deploy the swagger files, run the following command:

```bash
node scripts/deploy-swagger.js
```

To update and deploy the swagger files in one command, run the following command:

```bash
node scripts/publish-swagger.js
```

## Swagger UI

The `index.html` file uses [Swagger UI](https://github.com/swagger-api/swagger-ui) to render the API documentation in the browser. Please refer to their documentation for configuration options.