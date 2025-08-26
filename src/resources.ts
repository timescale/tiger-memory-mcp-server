import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { AdditionalSetupArgs } from './shared/boilerplate/src/mcpServer.js';
import { Memory, ServerContext } from './types.js';

export const additionalSetup = ({
  context: { pgPool, schema },
  server,
}: AdditionalSetupArgs<ServerContext>) => {
  server.registerResource(
    'memories',
    new ResourceTemplate('memory://{key}', { list: undefined }),
    {
      title: 'Memories',
      description: 'A collection of memories',
    },
    async (uri, { key }) => {
      const result = await pgPool.query<Memory>(
        /* sql */ `
SELECT id, content, created_at, updated_at
FROM ${schema}.memory
WHERE key = $1 AND deleted_at IS NULL
`,
        [key],
      );

      return {
        contents: [
          {
            uri: uri.href,
            text: `Memories: key=\`${key}\`, count=${result.rows.length}
${result.rows.map((m) => `- (${m.id}) ${m.content}`).join('\n')}
`,
          },
        ],
      };
    },
  );
};
