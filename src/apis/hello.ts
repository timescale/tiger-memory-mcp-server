import { ApiFactory, InferSchema } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { ServerContext } from '../types.js';

const inputSchema = {
  name: z.string().optional().describe('Optional name to greet.'),
} as const;

const outputSchema = {
  message: z.string().describe('The hello world greeting message.'),
} as const;

export const helloFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = () => ({
  name: 'hello',
  method: 'get',
  route: '/hello',
  config: {
    title: 'Hello World',
    description:
      'A simple hello world endpoint that returns a greeting message.',
    inputSchema,
    outputSchema,
  },
  fn: async ({ name }): Promise<InferSchema<typeof outputSchema>> => {
    const greeting = name ? `Hello, ${name}!` : 'Hello, World!';

    return {
      message: greeting,
    };
  },
});
