import {
  ApiFactory,
  InferSchema,
  StatusError,
} from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { ServerContext, zScopeInput, zSourceInput } from '../types.js';

const inputSchema = {
  id: z.coerce
    .string()
    .min(1)
    .describe('Required. The id of a specific memory to replace.'),
  scope: zScopeInput,
  content: z.string().min(1).describe('Required. The new content to remember.'),
  source: zSourceInput,
} as const;

const outputSchema = {
  id: z.string().describe('The unique identifier of the updated memory.'),
} as const;

export const updateFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = ({ pgPool, schema }) => ({
  name: 'update',
  method: 'put',
  route: ['/memory', '/memory/:id'],
  config: {
    title: 'Update an existing memory',
    description:
      'This endpoint updates an existing memory in the database, using the provided id to identify the memory to update.',
    inputSchema,
    outputSchema,
  },
  fn: async ({
    id,
    scope,
    content,
    source,
  }): Promise<InferSchema<typeof outputSchema>> => {
    const result = await pgPool.query<{ id: string }>(
      /* sql */ `
UPDATE ${schema}.memory
SET content = $1, source = $2, updated_at = NOW()
WHERE id = $3 AND scope = $4 AND deleted_at IS NULL
RETURNING id
`,
      [content, source || null, id, scope],
    );

    if (result.rows[0]?.id == null) {
      throw new StatusError(`Memory with id ${id} not found`, 404);
    }

    return {
      id: result.rows[0].id,
    };
  },
});
