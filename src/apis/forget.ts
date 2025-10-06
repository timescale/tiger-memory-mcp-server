import { ApiFactory, StatusError } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { ServerContext, zScope } from '../types.js';

const inputSchema = {
  id: z.coerce
    .string()
    .min(1)
    .describe('The id of a specific memory to delete.'),
  scope: zScope,
} as const;

const outputSchema = {
  id: z.string().describe('The unique identifier of the deleted memory.'),
} as const;

export const forgetFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = ({ pgPool, schema }) => ({
  name: 'forget',
  method: 'delete',
  route: ['/memory', '/memory/:id'],
  config: {
    title: 'Delete an existing memory',
    description:
      'This endpoint deletes an existing memory in the database, using the provided id to identify the memory to delete.',
    inputSchema,
    outputSchema,
  },
  fn: async ({ id, scope }) => {
    const result = await pgPool.query<{ id: string }>(
      /* sql */ `
UPDATE ${schema}.memory
SET deleted_at = NOW(), updated_at = NOW()
WHERE id = $1 AND scope = $2 AND deleted_at IS NULL
RETURNING id
`,
      [id, scope],
    );

    if (result.rows[0]?.id == null) {
      throw new StatusError(`Memory with id ${id} not found`, 404);
    }

    return {
      id: result.rows[0].id,
    };
  },
});
