import type { Provider } from '@nestjs/common';
import { initWeaviateClient, ensureUserCollection } from '@prmichaelsen/remember-core/database/weaviate';
import { initFirestore } from '@prmichaelsen/remember-core/database/firestore';
import { createLogger } from '@prmichaelsen/remember-core/utils';
import { ConfirmationTokenService, createHaikuClient, createModerationClient, MemoryIndexService, createDefaultRegistry, createVisionClient, createDocumentAiClient } from '@prmichaelsen/remember-core/services';
import { createBatchedWebhookService } from '@prmichaelsen/remember-core/webhooks';
import type { EventBus } from '@prmichaelsen/remember-core/webhooks';
import { ConfigService } from '../config/config.service.js';

export const WEAVIATE_CLIENT = Symbol('WEAVIATE_CLIENT');
export const LOGGER = Symbol('LOGGER');
export const CONFIRMATION_TOKEN_SERVICE = Symbol('CONFIRMATION_TOKEN_SERVICE');
export const HAIKU_CLIENT = Symbol('HAIKU_CLIENT');
export const JOB_SERVICE = Symbol('JOB_SERVICE');
export const MEMORY_INDEX = Symbol('MEMORY_INDEX');
export const MODERATION_CLIENT = Symbol('MODERATION_CLIENT');
export const EXTRACTOR_REGISTRY = Symbol('EXTRACTOR_REGISTRY');
export const EVENT_BUS = Symbol('EVENT_BUS');

export const weaviateClientProvider: Provider = {
  provide: WEAVIATE_CLIENT,
  useFactory: async (configService: ConfigService) => {
    const { restUrl, grpcUrl, apiKey } = configService.weaviateConfig;
    const { apiKey: embeddingsApiKey, provider } =
      configService.embeddingsConfig;

    const client = await initWeaviateClient({
      url: restUrl,
      apiKey,
      ...(provider === 'openai' ? { openaiApiKey: embeddingsApiKey } : {}),
    });

    return client;
  },
  inject: [ConfigService],
};

export const firestoreProvider: Provider = {
  provide: 'FIRESTORE_INIT',
  useFactory: (configService: ConfigService) => {
    const { projectId, serviceAccountKey } = configService.firebaseConfig;
    // Initialize v8 SDK (used by remember-core services)
    initFirestore({
      serviceAccount: serviceAccountKey,
      projectId,
    });
    return true;
  },
  inject: [ConfigService],
};

export const loggerProvider: Provider = {
  provide: LOGGER,
  useFactory: (configService: ConfigService) => {
    return createLogger(configService.serverConfig.logLevel as any);
  },
  inject: [ConfigService],
};

export const confirmationTokenServiceProvider: Provider = {
  provide: CONFIRMATION_TOKEN_SERVICE,
  useFactory: (logger: any) => {
    return new ConfirmationTokenService(logger);
  },
  inject: [LOGGER],
};

export const haikuClientProvider: Provider = {
  provide: HAIKU_CLIENT,
  useFactory: (configService: ConfigService) => {
    const { apiKey, haikuModel } = configService.anthropicConfig;
    if (!apiKey) return null;
    return createHaikuClient({ apiKey, model: haikuModel });
  },
  inject: [ConfigService],
};

export const memoryIndexProvider: Provider = {
  provide: MEMORY_INDEX,
  useFactory: (logger: any) => {
    return new MemoryIndexService(logger);
  },
  inject: [LOGGER],
};

export const moderationClientProvider: Provider = {
  provide: MODERATION_CLIENT,
  useFactory: (configService: ConfigService) => {
    const { apiKey } = configService.anthropicConfig;
    if (!apiKey) return null;
    return createModerationClient({ apiKey });
  },
  inject: [ConfigService],
};

export const extractorRegistryProvider: Provider = {
  provide: EXTRACTOR_REGISTRY,
  useFactory: async (configService: ConfigService) => {
    const { gcpServiceAccountKey, documentAiProcessorId, documentAiLocation } = configService.extractionConfig;

    const visionClient = gcpServiceAccountKey
      ? await createVisionClient({ serviceAccountKey: gcpServiceAccountKey })
      : undefined;

    const documentAiClient = gcpServiceAccountKey && documentAiProcessorId
      ? await createDocumentAiClient({
          serviceAccountKey: gcpServiceAccountKey,
          processorId: documentAiProcessorId,
          location: documentAiLocation,
        })
      : undefined;

    return createDefaultRegistry({ visionClient, documentAiClient });
  },
  inject: [ConfigService],
};

export const eventBusProvider: Provider = {
  provide: EVENT_BUS,
  useFactory: (configService: ConfigService, logger: any): EventBus | null => {
    const { url, signingSecret } = configService.webhookConfig;
    if (!url || !signingSecret) return null;
    return createBatchedWebhookService(logger, {
      resolveEndpoint: () => [{ url, signingSecret }],
    });
  },
  inject: [ConfigService, LOGGER],
};

/**
 * Safely ensure a user collection exists, tolerating "already exists" race conditions.
 */
export async function safeEnsureUserCollection(client: any, userId: string): Promise<void> {
  try {
    await ensureUserCollection(client, userId);
  } catch (err: any) {
    if (err?.message?.includes('already exists')) return;
    throw err;
  }
}
