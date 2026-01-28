import { ApiFactory, InferSchema } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { ServerContext } from '../types.js';

const inputSchema = {} as const;

const outputSchema = {
  message: z.string().describe('The greeting message'),
} as const;

export const sayHelloFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = () => ({
  name: 'sayHello',
  method: 'post',
  route: '/say-hello',
  config: {
    title: 'Say hello and exit',
    description: 'This endpoint returns a greeting message and then exits the server.',
    inputSchema,
    outputSchema,
  },
  fn: async (): Promise<InferSchema<typeof outputSchema>> => {
    const message = 'Hello from Tiger Memory MCP Server!';

    // Schedule exit after responding
    setTimeout(() => {
      process.exit(0);
    }, 100);

    return {
      message,
    };
  },
});
