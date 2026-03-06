import { Global, Module } from '@nestjs/common';
import {
  weaviateClientProvider,
  firestoreProvider,
  loggerProvider,
  confirmationTokenServiceProvider,
  haikuClientProvider,
  memoryIndexProvider,
  moderationClientProvider,
  extractorRegistryProvider,
  WEAVIATE_CLIENT,
  LOGGER,
  CONFIRMATION_TOKEN_SERVICE,
  HAIKU_CLIENT,
  MEMORY_INDEX,
  MODERATION_CLIENT,
  EXTRACTOR_REGISTRY,
} from './core.providers.js';

@Global()
@Module({
  providers: [
    weaviateClientProvider,
    firestoreProvider,
    loggerProvider,
    confirmationTokenServiceProvider,
    haikuClientProvider,
    memoryIndexProvider,
    moderationClientProvider,
    extractorRegistryProvider,
  ],
  exports: [WEAVIATE_CLIENT, 'FIRESTORE_INIT', LOGGER, CONFIRMATION_TOKEN_SERVICE, HAIKU_CLIENT, MEMORY_INDEX, MODERATION_CLIENT, EXTRACTOR_REGISTRY],
})
export class CoreModule {}
