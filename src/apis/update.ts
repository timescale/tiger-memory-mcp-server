import { z } from 'zod';
import { ApiFactory } from '../shared/boilerplate/src/types.js';
import { ServerContext, zKey } from '../types.js';
import { StatusError } from '../shared/boilerplate/src/StatusError.js';

const inputSchema = {
  id: z.coerce
    .string()
    .min(1)
    .describe('The id of a specific memory to replace.'),
  key: zKey,
  content: z.string().min(1).describe('The new content to remember.'),
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
  fn: async ({ id, key, content }) => {
    const result = await pgPool.query<{ id: string }>(
      /* sql */ `
UPDATE ${schema}.memory
SET content = $1, updated_at = NOW()
WHERE id = $2 AND key = $3 AND deleted_at IS NULL
RETURNING id
`,
      [content, id, key],
    );

    if (result.rows[0]?.id == null) {
      throw new StatusError(`Memory with id ${id} not found`, 404);
    }

    return {
      id: result.rows[0].id,
    };
  },
});
