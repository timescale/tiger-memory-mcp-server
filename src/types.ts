import { z } from 'zod';
import type { Pool } from 'pg';

export interface ServerContext extends Record<string, unknown> {
  pgPool: Pool;
  schema: string;
}

const sourceDescription =
  'The source or origin of this memory. A deep URI to the origin of the fact is preferred (e.g., a specific URL, file path, or reference).';

export const zSource = z.string().min(0).nullable().describe(sourceDescription);

/** Input-only variant of {@link zSource}: may be omitted or null. */
export const zSourceInput = z
  .string()
  .min(0)
  .nullish()
  .describe(`Optional. ${sourceDescription} Defaults to null.`);

export const zMemory = z.object({
  id: z.string().describe('The unique identifier of this memory.'),
  content: z.string().describe('The content of this memory.'),
  source: zSource,
  created_at: z
    .date()
    .describe('The date and time when this memory was created.'),
  updated_at: z
    .date()
    .describe('The date and time when this memory was last updated.'),
});

export type Memory = z.infer<typeof zMemory>;

const scopeDescription =
  'A unique identifier for the target set of memories. Can be any combination of user, application, contextual ids, as needed for scoping and personalization.';

export const zScope = z.string().min(1).describe(scopeDescription);

/** Input-only variant of {@link zScope}. */
export const zScopeInput = zScope.describe(`Required. ${scopeDescription}`);
