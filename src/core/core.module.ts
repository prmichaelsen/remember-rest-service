import { Global, Module } from '@nestjs/common';
import {
  weaviateClientProvider,
  firestoreProvider,
  loggerProvider,
  WEAVIATE_CLIENT,
  LOGGER,
} from './core.providers.js';

@Global()
@Module({
  providers: [weaviateClientProvider, firestoreProvider, loggerProvider],
  exports: [WEAVIATE_CLIENT, 'FIRESTORE_INIT', LOGGER],
})
export class CoreModule {}
