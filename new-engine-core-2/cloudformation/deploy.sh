#!/usr/bin/env bash

set -euo pipefail

export AWS_PROFILE=${PROFILE}

REGION=${REGION}

STACK_NAME=${STACK_NAME:-f2-platform}

ARTIFACT_BUCKET=${ARTIFACT_BUCKET:-f2-cf-artifacts}
TIMESTAMP=$(date +%Y-%m-%d-%H-%M-%S)
export VERSION=$(node -p "require('../package.json').version")
echo "Current version is $VERSION"
S3_PREFIX="$STACK_NAME/$VERSION-$TIMESTAMP/core"
echo "Current S3_PREFIX is $S3_PREFIX"

PARAMS_FILE=${PARAMS_FILE:-file://params/dev.json}

# Constants
TEMPLATE_FILE="prepared-main.yaml"
OUTPUT_FILE="f2-platform.yaml"

echo "🛠️  Preparing lambdas..."
sh ./lambda_prepare.sh

if [[ -f "$OUTPUT_FILE" ]]; then
  rm "$OUTPUT_FILE"
  echo "🗑  Remove '$OUTPUT_FILE' file."
fi

# state=$(aws cloudformation describe-stacks \
#       --region "$REGION" \
#       --stack-name "$STACK_NAME" \
#       --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")

# if [[ "$state" == "ROLLBACK_COMPLETE" || "$state" == "UPDATE_ROLLBACK_FAILED" ]]; then
#     echo "🧹 Stack $STACK_NAME is in ROLLBACK_COMPLETE or UPDATE_ROLLBACK_FAILED"
# fi

echo "🛠️  Preparing template..."
envsubst '${VERSION}' < ./main.yaml > ./$TEMPLATE_FILE

echo "▶️  Packaging $STACK_NAME …"
aws cloudformation package \
  --region "$REGION" \
  --template-file "$TEMPLATE_FILE" \
  --s3-bucket "$ARTIFACT_BUCKET" \
  --s3-prefix "$S3_PREFIX" \
  --output-template-file "$OUTPUT_FILE"
echo "✅ Stack $STACK_NAME packaged"

aws cloudformation validate-template --region "$REGION" --template-body file://$OUTPUT_FILE > /dev/null

echo "📥 Copy build stack to S3 bucket"
aws s3 cp ./$OUTPUT_FILE s3://$ARTIFACT_BUCKET/$S3_PREFIX/$OUTPUT_FILE
aws s3 cp ./$OUTPUT_FILE s3://$ARTIFACT_BUCKET/$STACK_NAME/latest/$OUTPUT_FILE

echo "🗑  Remove prepared template file"
rm ./"$TEMPLATE_FILE"

# TODO: Need to discuss with team about this
# echo "▶️  Deploying $STACK_NAME …"
# aws cloudformation deploy \
#   --region        "$REGION" \
#   --template-file "$OUTPUT_FILE" \
#   --stack-name    "$STACK_NAME" \
#   --s3-bucket     "$ARTIFACT_BUCKET" \
#   --parameter-overrides "$PARAMS_FILE" \
#   --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND

# if [[ -f "$OUTPUT_FILE" ]]; then
#   rm "$OUTPUT_FILE"
#   echo "🗑  File '$OUTPUT_FILE' is deleted."
# else
#   echo "⚠️ File ‘$OUTPUT_FILE’ not found — the packaging may have failed."
#   exit 1
# fi

# echo "✅ Stack $STACK_NAME deployed"
