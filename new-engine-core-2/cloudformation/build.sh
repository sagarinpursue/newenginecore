#!/usr/bin/env bash

set -euo pipefail
echo "🛠️  Build $ENV."

IFS=',' read -r -a regions <<< "$BUILD_REGIONS"

STACK_NAME=${STACK_NAME:-f2-platform}

export VERSION=$(node -p "require('../package.json').version")
echo "Current version is $VERSION"
S3_PREFIX="$STACK_NAME/$VERSION"
echo "Current S3_PREFIX is $S3_PREFIX"

PARAMS_FILE=${PARAMS_FILE:-file://params/dev.json}

# Constants
MODULE_TEMPLATE_FILE="template.yaml"
TEMPLATE_FILE="prepared-main.yaml"
OUTPUT_FILE="f2-platform.yaml"

echo "🛠️  Preparing lambdas..."
sh ./lambda_prepare.sh

if [[ -f "$OUTPUT_FILE" ]]; then
  rm "$OUTPUT_FILE"
  echo "🗑  Remove '$OUTPUT_FILE' file."
fi

for REGION in "${regions[@]}"; do
  echo "🛠️  Preparing template for Region - $REGION"
  envsubst '${VERSION}' < ./main.yaml > ./$TEMPLATE_FILE

  ARTIFACT_BUCKET="f2-platform-artifacts-$REGION-$ENV"

  if aws s3api head-bucket --bucket "$ARTIFACT_BUCKET" 2>/dev/null; then
      echo "   ✅ Bucket $ARTIFACT_BUCKET exists."
  else
      echo "   📦 Bucket not found. Creating $ARTIFACT_BUCKET..."
      aws s3 mb "s3://$ARTIFACT_BUCKET" --region "$REGION"
  fi

  echo "▶️  Packaging CX module"
  aws cloudformation package \
    --region "$REGION" \
    --template-file "./templates/modules/cx.yaml" \
    --s3-bucket "$ARTIFACT_BUCKET" \
    --s3-prefix "$S3_PREFIX/cx" \
    --output-template-file "$MODULE_TEMPLATE_FILE"
  echo "✅ CX module packaged"

  echo "📥 Copy built CX module template to S3 bucket"
  aws s3 cp ./$MODULE_TEMPLATE_FILE s3://$ARTIFACT_BUCKET/$S3_PREFIX/cx/$MODULE_TEMPLATE_FILE

  echo "🛠️  Validating CX template for Region - $REGION"
  aws cloudformation validate-template \
    --region "$REGION" \
    --template-url "https://s3.amazonaws.com/$ARTIFACT_BUCKET/$S3_PREFIX/cx/$MODULE_TEMPLATE_FILE" > /dev/null

  echo "🗑  Remove prepared module template file"
  rm ./"$MODULE_TEMPLATE_FILE"

  echo " "

  echo "▶️  Packaging core $STACK_NAME …"
  aws cloudformation package \
    --region "$REGION" \
    --template-file "$TEMPLATE_FILE" \
    --s3-bucket "$ARTIFACT_BUCKET" \
    --s3-prefix "$S3_PREFIX/core" \
    --output-template-file "$OUTPUT_FILE"
  echo "✅ Stack $STACK_NAME packaged"

  echo "📥 Copy build stack to S3 bucket"
  aws s3 cp ./$OUTPUT_FILE s3://$ARTIFACT_BUCKET/$S3_PREFIX/$OUTPUT_FILE
  # aws s3 cp ./$OUTPUT_FILE s3://$ARTIFACT_BUCKET/$STACK_NAME/latest/$OUTPUT_FILE

  echo "🛠️  Validating Core template for Region - $REGION"
  aws cloudformation validate-template \
    --region "$REGION" \
    --template-url "https://s3.amazonaws.com/$ARTIFACT_BUCKET/$S3_PREFIX/$OUTPUT_FILE" > /dev/null

  echo "🗑  Remove prepared template file"
  rm ./"$TEMPLATE_FILE"
  rm ./"$OUTPUT_FILE"
done

echo "✅ Stack $STACK_NAME built in Build Regions: $BUILD_REGIONS"
