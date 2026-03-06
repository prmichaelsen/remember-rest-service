# Task 60: App Spaces Controller

## Objective

Create `AppSpacesController` at `api/app/v1/spaces` with `POST comments` endpoint. Follows the `ProfilesController` pattern exactly.

## Steps

1. Create `src/app/spaces/app-spaces.controller.ts`
2. `@Controller('api/app/v1/spaces')` class
3. Inject providers: `WEAVIATE_CLIENT`, `LOGGER`, `CONFIRMATION_TOKEN_SERVICE`, `MODERATION_CLIENT`, `MEMORY_INDEX`
4. Private helpers: `getMemoryService(userId)`, `getSpaceService(userId)` — same pattern as ProfilesController
5. `@Post('comments')` endpoint:
   - Get memoryService + spaceService for authenticated user
   - `memoryService.create({ content, type: 'comment', parent_id, thread_root_id ?? parent_id, tags })`
   - `spaceService.publish({ memory_id, spaces, groups })`
   - `spaceService.confirm({ token })`
   - Return 201 with `{ memory_id, created_at, composite_id, published_to }`
6. Register in `AppTierModule`

## Dependencies

- Task 58 (remember-core bump)
- Task 59 (DTO)

## Verification

- [ ] Controller created at `src/app/spaces/app-spaces.controller.ts`
- [ ] Registered in `src/app/app-tier.module.ts`
- [ ] `@Post('comments')` wired with `@User()` decorator and `CreateCommentDto`
- [ ] Returns HttpStatus.CREATED (201)
