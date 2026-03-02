export interface ServerConfig {
  port: number;
  nodeEnv: string;
  logLevel: string;
}

export interface AuthConfig {
  serviceToken: string;
  issuer: string;
  audience: string;
}

export interface CorsConfig {
  origin: string;
}

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export interface WeaviateConfig {
  restUrl: string;
  grpcUrl: string;
  apiKey: string;
}

export interface FirebaseConfig {
  projectId: string;
  serviceAccountKey: string;
}

export interface EmbeddingsConfig {
  provider: string;
  model: string;
  apiKey: string;
}

export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bedrockModelId: string;
}

export interface AppConfig {
  server: ServerConfig;
  auth: AuthConfig;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  weaviate: WeaviateConfig;
  firebase: FirebaseConfig;
  embeddings: EmbeddingsConfig;
  aws: AwsConfig;
}
