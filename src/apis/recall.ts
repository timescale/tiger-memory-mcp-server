import { ApiFactory, InferSchema } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { Memory, ServerContext, zScope, zMemory } from '../types.js';

const inputSchema = {
  scope: zScope,
} as const;

const outputSchema = {
  memories: z.array(zMemory).describe('The list of memories found.'),
  scope: zScope,
} as const;

export const recallFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = ({ pgPool, schema }) => ({
  name: 'recall',
  method: 'get',
  route: ['/memory', '/memory/:scope'],
  config: {
    title: 'Retrieve memories by scope',
    description:
      'This endpoint retrieves memories from the database, using the provided scope.',
    inputSchema,
    outputSchema,
  },
  fn: async ({ scope }): Promise<InferSchema<typeof outputSchema>> => {
    const result = await pgPool.query<Memory>(
      /* sql */ `
SELECT id, content, source, created_at, updated_at
FROM ${schema}.memory
WHERE scope = $1 AND deleted_at IS NULL
`,
      [scope],
    );

    return {
      memories: result.rows,
      scope,
    };
  },
});
