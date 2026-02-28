import type { Provider } from '@nestjs/common';
import { initWeaviateClient } from '@prmichaelsen/remember-core/database/weaviate';
import { initFirestore } from '@prmichaelsen/remember-core/database/firestore';
import { createLogger } from '@prmichaelsen/remember-core/utils';
import { ConfigService } from '../config/config.service.js';

export const WEAVIATE_CLIENT = Symbol('WEAVIATE_CLIENT');
export const LOGGER = Symbol('LOGGER');

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
    const env = configService.serverConfig.nodeEnv;
    const logLevel = env === 'production' ? 'warn' : 'debug';
    return createLogger(logLevel);
  },
  inject: [ConfigService],
};
