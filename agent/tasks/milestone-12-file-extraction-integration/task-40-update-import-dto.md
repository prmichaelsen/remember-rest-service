# Task 40: Update Import DTO

**Milestone**: [M12 - File Extraction Integration](../../milestones/milestone-12-file-extraction-integration.md)
**Estimated Time**: 1 hour
**Dependencies**: None
**Status**: Not Started

---

## Objective

Update `ImportItemDto` and `ImportMemoriesDto` to accept `file_url` and `mime_type` fields, making `content` optional while enforcing that one of `content` or `file_url` is provided.

---

## Steps

### 1. Update ImportItemDto

In `src/memories/memories.dto.ts`:

```typescript
export class ImportItemDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  file_url?: string;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  @IsString()
  source_filename?: string;
}
```

Note: `content` changes from required `@IsString()` to optional. The mutual exclusivity and `mime_type` requirement are validated at the controller level via `validateImportItems()` (task-41), not in the DTO — class-validator doesn't support cross-field validation cleanly.

### 2. Write Unit Tests

- Verify DTO accepts `content`-only items (backward compatible)
- Verify DTO accepts `file_url` + `mime_type` items
- Verify DTO accepts mixed items (some content, some file_url)
- Verify `content` is now optional

---

## Verification

- [ ] `ImportItemDto` accepts `file_url` and `mime_type`
- [ ] `content` is optional
- [ ] Existing DTO validation still works for text-only items
- [ ] Build passes
- [ ] Existing tests pass
