import { Injectable } from '@nestjs/common';
import type { AppConfig } from './config.types.js';

@Injectable()
export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    return {
      server: {
        port: this.getInt('PORT', 8080),
        nodeEnv: this.get('NODE_ENV', 'development'),
        logLevel: this.get('LOG_LEVEL', 'info'),
      },
      auth: {
        serviceToken: this.getRequired('PLATFORM_SERVICE_TOKEN'),
        issuer: this.get('JWT_ISSUER', 'agentbase.me'),
        audience: this.get('JWT_AUDIENCE', 'svc'),
      },
      cors: {
        origin: this.get('CORS_ORIGIN', 'https://agentbase.me'),
      },
      rateLimit: {
        max: this.getInt('RATE_LIMIT_MAX', 1000),
        windowMs: this.getInt('RATE_LIMIT_WINDOW_MS', 3600000),
      },
      weaviate: {
        restUrl: this.getRequired('WEAVIATE_REST_URL'),
        grpcUrl: this.getRequired('WEAVIATE_GRPC_URL'),
        apiKey: this.getRequired('WEAVIATE_API_KEY'),
      },
      firebase: {
        projectId: this.getRequired('FIREBASE_PROJECT_ID'),
        serviceAccountKey: this.getRequired('FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY'),
      },
      embeddings: {
        provider: this.getRequired('EMBEDDINGS_PROVIDER'),
        model: this.getRequired('EMBEDDINGS_MODEL'),
        apiKey: this.get('EMBEDDINGS_API_KEY', ''),
      },
      aws: {
        accessKeyId: this.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.get('AWS_SECRET_ACCESS_KEY', ''),
        region: this.get('AWS_REGION', ''),
        bedrockModelId: this.get('BEDROCK_MODEL_ID', ''),
      },
    };
  }

  private get(key: string, defaultValue: string): string {
    return process.env[key] ?? defaultValue;
  }

  private getRequired(key: string): string {
    const value = process.env[key];
    if (value === undefined || value === '') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private getInt(key: string, defaultValue: number): number {
    const raw = process.env[key];
    if (raw === undefined) return defaultValue;
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a number, got: ${raw}`);
    }
    return parsed;
  }

  getConfig(): AppConfig {
    return this.config;
  }

  get serverConfig() {
    return this.config.server;
  }

  get authConfig() {
    return this.config.auth;
  }

  get corsConfig() {
    return this.config.cors;
  }

  get rateLimitConfig() {
    return this.config.rateLimit;
  }

  get weaviateConfig() {
    return this.config.weaviate;
  }

  get firebaseConfig() {
    return this.config.firebase;
  }

  get embeddingsConfig() {
    return this.config.embeddings;
  }

  get awsConfig() {
    return this.config.aws;
  }
}
