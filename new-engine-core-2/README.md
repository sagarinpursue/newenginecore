Description

TBD

Scripts
1. Deploy ALL resources of ALL services
    - `node deploy-all.js`
    - OR
    - `npm run deploy-all`
2. Deploy ALL resources for a particular AWS service
   1. Go to a service directory (lambda-functions, s3, scheduler and etc.)
   2. `node deploy-all.js`
3. Lambda functions (lambda-functions directory)
   1. Local run a particular lambda function
      1. Go to a lambda directory
      2. `npm run local-run`
   2. Deploy a particular lambda function
      1. Go to a lambda directory
      2. `npm run deploy`