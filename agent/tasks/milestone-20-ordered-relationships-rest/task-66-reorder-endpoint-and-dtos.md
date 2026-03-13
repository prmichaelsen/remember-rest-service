# Task 66: Reorder Endpoint + DTOs

**Status**: not_started
**Milestone**: M20 — Ordered Relationships REST Endpoints
**Created**: 2026-03-13
**Estimated Hours**: 1-2
**Dependencies**: None (remember-core types assumed available)

---

## Objective

Add `POST /api/svc/v1/relationships/:id/reorder` endpoint to `RelationshipsController` with a class-validator DTO for the discriminated union of 5 reorder operation types.

## Context

remember-core exports:
- `ReorderRelationshipInput { relationship_id, operation, version }`
- `ReorderRelationshipResult { relationship_id, member_order, version, updated_at }`
- `ReorderOperation` — discriminated union with 5 types
- `RelationshipService.reorder(input)` — performs the operation with optimistic locking

The REST layer needs a validated DTO and a controller method that delegates to the service.

## Steps

### 1. Create ReorderRelationshipDto in `src/relationships/relationships.dto.ts`

Add to existing DTO file:

```typescript
import { Type } from 'class-transformer';
import { ValidateNested, IsInt, IsString, IsArray, IsNumber, IsIn } from 'class-validator';

// Operation sub-DTOs
class MoveToIndexOperationDto {
  @IsIn(['move_to_index'])
  type!: 'move_to_index';

  @IsString()
  memory_id!: string;

  @IsNumber()
  index!: number;
}

class SwapOperationDto {
  @IsIn(['swap'])
  type!: 'swap';

  @IsString()
  memory_id_a!: string;

  @IsString()
  memory_id_b!: string;
}

class SetOrderOperationDto {
  @IsIn(['set_order'])
  type!: 'set_order';

  @IsArray()
  @IsString({ each: true })
  ordered_memory_ids!: string[];
}

class MoveBeforeOperationDto {
  @IsIn(['move_before'])
  type!: 'move_before';

  @IsString()
  memory_id!: string;

  @IsString()
  before!: string;
}

class MoveAfterOperationDto {
  @IsIn(['move_after'])
  type!: 'move_after';

  @IsString()
  memory_id!: string;

  @IsString()
  after!: string;
}

export class ReorderRelationshipDto {
  @ValidateNested()
  @Type(() => Object, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: MoveToIndexOperationDto, name: 'move_to_index' },
        { value: SwapOperationDto, name: 'swap' },
        { value: SetOrderOperationDto, name: 'set_order' },
        { value: MoveBeforeOperationDto, name: 'move_before' },
        { value: MoveAfterOperationDto, name: 'move_after' },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  operation!: MoveToIndexOperationDto | SwapOperationDto | SetOrderOperationDto | MoveBeforeOperationDto | MoveAfterOperationDto;

  @IsInt()
  version!: number;
}
```

### 2. Add reorder method to `RelationshipsController`

```typescript
@Post(':id/reorder')
async reorder(
  @User() userId: string,
  @Param('id') id: string,
  @Body() dto: ReorderRelationshipDto,
) {
  const service = await this.getService(userId);
  return service.reorder({
    relationship_id: id,
    operation: dto.operation,
    version: dto.version,
  } as ReorderRelationshipInput);
}
```

### 3. Import types

Add `ReorderRelationshipInput` to the import from `@prmichaelsen/remember-core/services`.

## Verification

- [ ] `POST /api/svc/v1/relationships/:id/reorder` endpoint exists
- [ ] DTO validates `operation.type` discriminator
- [ ] DTO validates `version` as integer
- [ ] Each operation type's fields are validated
- [ ] Invalid operation type returns 400
- [ ] Service is called with correct `ReorderRelationshipInput`
- [ ] No regressions on existing endpoints
