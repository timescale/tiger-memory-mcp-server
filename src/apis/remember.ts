import { z } from 'zod';
import { ApiFactory } from '../shared/boilerplate/src/types.js';
import { ServerContext, zKey, zSource } from '../types.js';

const inputSchema = {
  key: zKey,
  content: z.string().min(1).describe('The content to remember.'),
  source: zSource,
} as const;

const outputSchema = {
  id: z.string().describe('The unique identifier of the new memory.'),
} as const;

export const rememberFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = ({ pgPool, schema }) => ({
  name: 'remember',
  method: 'post',
  route: '/memory',
  config: {
    title: 'Store a new memory',
    description:
      'This endpoint stores a new memory in the database, using the provided key as the scope.',
    inputSchema,
    outputSchema,
  },
  fn: async ({ key, content, source }) => {
    const result = await pgPool.query<{ id: string }>(
      /* sql */ `
INSERT INTO ${schema}.memory (key, content, source)
VALUES ($1, $2, $3)
RETURNING id
`,
      [key, content, source || null],
    );

    return {
      id: result.rows[0].id,
    };
  },
});
