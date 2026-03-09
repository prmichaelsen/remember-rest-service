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
  eventBusProvider,
  WEAVIATE_CLIENT,
  LOGGER,
  CONFIRMATION_TOKEN_SERVICE,
  HAIKU_CLIENT,
  MEMORY_INDEX,
  MODERATION_CLIENT,
  EXTRACTOR_REGISTRY,
  EVENT_BUS,
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
    eventBusProvider,
  ],
  exports: [WEAVIATE_CLIENT, 'FIRESTORE_INIT', LOGGER, CONFIRMATION_TOKEN_SERVICE, HAIKU_CLIENT, MEMORY_INDEX, MODERATION_CLIENT, EXTRACTOR_REGISTRY, EVENT_BUS],
})
export class CoreModule {}
