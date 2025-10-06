import { ApiFactory } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { ServerContext, zScope, zSource } from '../types.js';

const inputSchema = {
  scope: zScope,
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
      'This endpoint stores a new memory in the database, using the provided scope.',
    inputSchema,
    outputSchema,
  },
  fn: async ({ scope, content, source }) => {
    const result = await pgPool.query<{ id: string }>(
      /* sql */ `
INSERT INTO ${schema}.memory (scope, content, source)
VALUES ($1, $2, $3)
RETURNING id
`,
      [scope, content, source || null],
    );

    return {
      id: result.rows[0].id,
    };
  },
});
