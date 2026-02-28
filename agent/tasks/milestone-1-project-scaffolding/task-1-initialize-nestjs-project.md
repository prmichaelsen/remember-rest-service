# Task 1: Initialize NestJS Project

**Milestone**: [M1 - Project Scaffolding & Core Integration](../../milestones/milestone-1-project-scaffolding.md)
**Estimated Time**: 2-3 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Scaffold a new NestJS application with TypeScript, install remember-core and all required dependencies, and configure the build system.

---

## Context

This is the first task in the project. It creates the NestJS application shell that all subsequent tasks build upon. The project uses NestJS for its module system, dependency injection, and decorator-based routing.

---

## Steps

### 1. Initialize NestJS Project

Use the NestJS CLI to scaffold the project, or manually set up package.json and configuration.

### 2. Install Dependencies

**Production**:
- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`
- `@prmichaelsen/remember-core`
- `jsonwebtoken`
- `class-validator`, `class-transformer`
- `reflect-metadata`, `rxjs`

**Development**:
- `@nestjs/cli`, `@nestjs/testing`
- `typescript`, `@types/node`, `@types/jsonwebtoken`
- `jest`, `ts-jest`, `@types/jest`
- `eslint`, `prettier`

### 3. Configure TypeScript

Set up tsconfig.json and tsconfig.build.json for NestJS conventions (decorators, emit metadata).

### 4. Configure Jest

Configure Jest with ts-jest for `.spec.ts` and `.e2e.ts` file patterns. Tests are colocated with source.

### 5. Create .env.example

List all required environment variables with placeholder values.

### 6. Create .gitignore

Add node_modules, dist, .env, coverage, etc.

---

## Verification

- [ ] `npm install` succeeds
- [ ] `npm run build` compiles without errors
- [ ] `npm run start` boots without errors (empty app)
- [ ] `npm test` runs (no tests yet, but Jest configured)
- [ ] remember-core can be imported without errors
- [ ] .env.example lists all required variables

---

**Next Task**: [Task 2: Create Core Module](task-2-create-core-module.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
