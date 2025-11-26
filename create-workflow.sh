#!/bin/bash

# GitHub API endpoint
REPO_OWNER="2moulin"
REPO_NAME="solana-token-list"
WORKFLOW_PATH=".github/workflows/update-tokens.yml"

# Read workflow content and base64 encode it
WORKFLOW_CONTENT=$(cat .github/workflows/update-tokens.yml | base64 -w 0)

# GitHub API request to create the file
curl -X PUT \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${WORKFLOW_PATH} \
  -d "{
    \"message\": \"Add GitHub Actions workflow for automatic token list updates\",
    \"content\": \"${WORKFLOW_CONTENT}\"
  }"
