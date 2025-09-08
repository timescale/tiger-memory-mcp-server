import { z } from 'zod';
import { ApiFactory } from '../shared/boilerplate/src/types.js';
import { Memory, ServerContext, zKey, zMemory } from '../types.js';

const inputSchema = {
  key: zKey,
} as const;

const outputSchema = {
  memories: z.array(zMemory).describe('The list of memories found.'),
  key: zKey,
} as const;

export const getMemoriesFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = ({ pgPool, schema }) => ({
  name: 'getMemories',
  method: 'get',
  route: ['/memory', '/memory/:key'],
  config: {
    title: 'Retrieve memories by key',
    description:
      'This endpoint retrieves memories from the database, using the provided key as the scope.',
    inputSchema,
    outputSchema,
  },
  fn: async ({ key }) => {
    const result = await pgPool.query<Memory>(
      /* sql */ `
SELECT id, content, source, created_at, updated_at
FROM ${schema}.memory
WHERE key = $1 AND deleted_at IS NULL
`,
      [key],
    );

    return {
      memories: result.rows,
      key,
    };
  },
});
