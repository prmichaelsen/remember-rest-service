#!/usr/bin/env bash
# Fetches all secrets for remember-rest-service-e1 and writes them to .env.e1
set -euo pipefail

PROJECT="com-f5-parm"
OUTFILE="${1:-.env.e1}"

declare -A SECRETS=(
  [PLATFORM_SERVICE_TOKEN]="remember-e1-platform-service-token"
  [CORS_ORIGIN]="remember-e1-cors-origin"
  [WEAVIATE_REST_URL]="remember-e1-weaviate-rest-url"
  [WEAVIATE_GRPC_URL]="remember-e1-weaviate-grpc-url"
  [WEAVIATE_API_KEY]="remember-e1-weaviate-api-key"
  [FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY]="remember-e1-firebase-admin-service-account-key"
  [FIREBASE_PROJECT_ID]="remember-e1-firebase-project-id"
  [EMBEDDINGS_API_KEY]="remember-e1-openai-embeddings-api-key"
  [EMBEDDINGS_PROVIDER]="remember-e1-embeddings-provider"
  [EMBEDDINGS_MODEL]="remember-e1-embeddings-model"
  [AWS_ACCESS_KEY_ID]="remember-e1-aws-access-key-id"
  [AWS_SECRET_ACCESS_KEY]="remember-e1-aws-secret-access-key"
  [AWS_REGION]="remember-e1-aws-region"
  [BEDROCK_MODEL_ID]="remember-e1-bedrock-model-id"
)

> "$OUTFILE"

for env_name in "${!SECRETS[@]}"; do
  secret_name="${SECRETS[$env_name]}"
  value=$(gcloud secrets versions access latest --secret="$secret_name" --project="$PROJECT")
  echo "${env_name}=${value}" >> "$OUTFILE"
done

echo "NODE_ENV=production" >> "$OUTFILE"
echo "LOG_LEVEL=debug" >> "$OUTFILE"

echo "Written $(wc -l < "$OUTFILE") lines to $OUTFILE"
