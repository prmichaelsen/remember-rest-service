import { Global, Module } from '@nestjs/common';
import {
  weaviateClientProvider,
  firestoreProvider,
  loggerProvider,
  confirmationTokenServiceProvider,
  haikuClientProvider,
  memoryIndexProvider,
  moderationClientProvider,
  WEAVIATE_CLIENT,
  LOGGER,
  CONFIRMATION_TOKEN_SERVICE,
  HAIKU_CLIENT,
  MEMORY_INDEX,
  MODERATION_CLIENT,
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
  ],
  exports: [WEAVIATE_CLIENT, 'FIRESTORE_INIT', LOGGER, CONFIRMATION_TOKEN_SERVICE, HAIKU_CLIENT, MEMORY_INDEX, MODERATION_CLIENT],
})
export class CoreModule {}
