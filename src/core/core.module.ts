import { Global, Module } from '@nestjs/common';
import {
  weaviateClientProvider,
  firestoreProvider,
  loggerProvider,
  confirmationTokenServiceProvider,
  WEAVIATE_CLIENT,
  LOGGER,
  CONFIRMATION_TOKEN_SERVICE,
} from './core.providers.js';

@Global()
@Module({
  providers: [
    weaviateClientProvider,
    firestoreProvider,
    loggerProvider,
    confirmationTokenServiceProvider,
  ],
  exports: [WEAVIATE_CLIENT, 'FIRESTORE_INIT', LOGGER, CONFIRMATION_TOKEN_SERVICE],
})
export class CoreModule {}
