import { randomUUID } from 'node:crypto';

const RUN_ID = randomUUID().slice(0, 8);

export const TEST_USER_ID = `live-test-${RUN_ID}`;
export const TEST_TARGET_USER_ID = `live-test-target-${RUN_ID}`;
