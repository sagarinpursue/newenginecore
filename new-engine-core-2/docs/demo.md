# Platform Demo

1. [This step will be available via the platform UI later] Go to the AWS S3 Console > `f2-bucket-951bb7982507d4863117e86a91e510f8-dev/llm-data-sources`. Create a new folder and upload all the files for the demo.
2. Go to the Platform UI > LLM > Data Sources > Create a new Data Source. Set the chunk size based on the selected model (512 for Cohere, 2048 for Titan v2) and enter the name of the folder you created.
3. When the status becomes ACTIVE, open the details and click Sync.
4. Go to CX > AI Agents > Create a new agent. On the Configuration tab, add the Knowledge Base and click Deploy.
5. Go to CX > Chats > Create a new chat with the newly created AI Agent.
6. Go to CX > Channels > Create a new Web channel using the new chat, then open the channel details.
7. [This step will be available via the platform UI later] In your IDE, go to the widget repository and create a new `demo/{client_name}` branch from the `stage` branch.
    * In `src/environments/environment.ts`, add the `channel_id` from the channel details page.
    * In `deploy-dev.sh`, set the following variables:
        * `BUCKET_NAME`: `f2-bucket-951bb7982507d4863117e86a91e510f8-dev`
        * `BUCKET_FOLDER`: `/cx-channels/{channel_name}`
        * `DISTRIBUTION_ID`: Get this from the channel details page.
8. [This step will be available via the platform UI later] Execute the `npm run deploy-dev` command.