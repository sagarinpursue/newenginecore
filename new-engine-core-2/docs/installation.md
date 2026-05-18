# F2 Installation

1. **[Product team only]** Allow access for installation using AWS account ID and region: add policy to S3 bucket and share AMI image
2. Take needed `f2-platform.yaml` url and create the stack in CloudFormation with `F2-{client_name}-{env}` name in normal case.
	* N.Virginia: https://f2-platform-artifacts-us-east-1-dev.s3.us-east-1.amazonaws.com/f2-platform/latest/f2-platform.yaml
	* Oregon: https://f2-platform-artifacts-us-west-2-dev.s3.us-west-2.amazonaws.com/f2-platform/latest/f2-platform.yaml
	* Ireland: https://f2-platform-artifacts-eu-west-1-dev.s3.eu-west-1.amazonaws.com/f2-platform/latest/f2-platform.yaml
3. Select needed parameters and submit. In most part of cases module installation flags need to be changed only.
    > **Note:** [12/02/2025] Full installation (Core + CMS + WebUI + CX) took about 40 minutes. RDS stack ~8 min. EC2 stack ~20 min.

    > **Note:** [12/02/2025] Rollback in a reason of incorrectly shared AMI image took about 30 minutes.
4. **[Researching ways to automate]** Check logs of `f2-clf-migration-db-script` lambda, and forward all failed migrations to product team (name of migration file and error itself)
5. **[Researching ways to automate]** If CX module was installed, go to `f2-cx-sqs-response-analyst` lambda and replace `amazon.nova-pro-v1:0` with `us.amazon.nova-pro-v1:0` for Oregon and with `eu.amazon.nova-pro-v1:0` for Ireland. No changes needed in case of using N.Virginia.
6. After successful installation, in `new-engine-core` repo create a new `projects/{client_name}/{env}` branch from `stage` branch using lower case
7. **[Researching ways to automate]** Deploy portal:
	* in `newengineui` repo, create a new `projects/{client_name}/{env}` branch from `stage` branch using lower case
	* in `.environments/{env}/environments.ts` file change APP_URL and API_URL. Values are available in the CFT Outputs. Also set proper flags for modules, same way it was done in CFT parameters.
	* in `.environments/{env}/.env` file change BUCKET_NAME, PROFILE_NAME, and DISTRIBUTION_ID. Profile name is `f2-{client_name}-{env}` in lower case. The rest values are available in the CFT Outputs.
	* create a commit to new branch `initial commit for {client_name}` using normal case and push to repo
	* create aws profile locally
	* deploy using `npm run deploy-{env}`
8. Fill in the [installations table](https://docs.google.com/spreadsheets/d/1Q9As-dS12uTmls5An5QuF0GVbn3Ecg6uhsrSVMxTW5c/edit?gid=0#gid=0).
9. **[Optional]** Create more users if needed via F2 Portal UI.
10. **[Optional]** **[Product team only]** Set Provisioned Concurrency to `cx-request-processing` lambda.

## In case of Rollback

1. Delete main stack after finishing rollback process.

## F2 Regular Update

1. Merge the latest product changes into the `projects/{client_name}/dev` branches across all repositories from `stage` branches.
2. Take needed `f2-platform.yaml` url and update the stack with the new template.
3. Modify parameters if needed and submit.
4. **[Researching ways to automate]** Check logs of `f2-clf-migration-db-script` lambda, and forward all failed migrations to product team (name of migration file and error itself)
5. **[Researching ways to automate]** If CX module was activated during CFT update, go to `f2-cx-sqs-response-analyst` lambda and replace `amazon.nova-pro-v1:0` with `us.amazon.nova-pro-v1:0` for Oregon and with `eu.amazon.nova-pro-v1:0` for Ireland. No changes needed in case of using N.Virginia.
6. **[Researching ways to automate]** In case project branch contains changes, these changes should be deployed manually.
7. **[Researching ways to automate]** Redeploy the portal using `npm run deploy-{env}`.
8. **[Researching ways to optimize]** Redeploy the widget if needed using `npm run deploy-{env}`.
9. Update the [installations table](https://docs.google.com/spreadsheets/d/1Q9As-dS12uTmls5An5QuF0GVbn3Ecg6uhsrSVMnTW5c/edit?gid=0#gid=0).
