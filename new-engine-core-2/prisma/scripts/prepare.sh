#!/bin/bash

# Find the directory where the script itself is located.
SCRIPT_DIR=$(dirname "$0")
# Define the root prisma directory, which is one level up from the script's location.
PRISMA_DIR="$SCRIPT_DIR/.."

# Define the full paths to the files and directories.
TEMPLATE_FILE="$PRISMA_DIR/schema.prisma.template"
SCHEMAS_DIR="$PRISMA_DIR/schemas"
OUTPUT_FILE="$PRISMA_DIR/schema.prisma"

# Check if the template file exists before proceeding.
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "Error: Template file not found at $TEMPLATE_FILE"
    exit 1
fi

# Start by overwriting the output file with the content of the template file.
cat "$TEMPLATE_FILE" > "$OUTPUT_FILE"

# Add a newline for separation.
echo "" >> "$OUTPUT_FILE"

# Append the content of each file from the schemas directory.
# The 'ls' command checks if there are any .prisma files to prevent an error if the directory is empty.
if ls ${SCHEMAS_DIR}/*.prisma 1> /dev/null 2>&1; then
    for f in ${SCHEMAS_DIR}/*.prisma; do
      cat "$f" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    done
fi

echo "✅ Schema assembly complete: $OUTPUT_FILE"