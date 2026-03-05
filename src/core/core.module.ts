import { Global, Module } from '@nestjs/common';
import {
  weaviateClientProvider,
  firestoreProvider,
  loggerProvider,
  confirmationTokenServiceProvider,
  haikuClientProvider,
  memoryIndexProvider,
  WEAVIATE_CLIENT,
  LOGGER,
  CONFIRMATION_TOKEN_SERVICE,
  HAIKU_CLIENT,
  MEMORY_INDEX,
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
  ],
  exports: [WEAVIATE_CLIENT, 'FIRESTORE_INIT', LOGGER, CONFIRMATION_TOKEN_SERVICE, HAIKU_CLIENT, MEMORY_INDEX],
})
export class CoreModule {}
