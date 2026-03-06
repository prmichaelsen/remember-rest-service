# Task 58: Bump remember-core to >= 0.35.0

## Objective

Update `@prmichaelsen/remember-core` dependency to >= 0.35.0 for `createAndPublishComment` and `CreateCommentInput` exports.

## Steps

1. `npm i @prmichaelsen/remember-core@latest`
2. Verify `createAndPublishComment` is importable from `@prmichaelsen/remember-core/services` or web SDK
3. Run existing tests to check no regressions

## Verification

- [ ] package.json shows remember-core >= 0.35.0
- [ ] Import resolves without errors
- [ ] Existing tests pass
