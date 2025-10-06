import {
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { AdditionalSetupArgs } from '@tigerdata/mcp-boilerplate';
import { Memory, ServerContext } from './types.js';

export const additionalSetup = ({
  context: { pgPool, schema },
  server,
}: AdditionalSetupArgs<ServerContext>) => {
  server.registerResource(
    'memories',
    new ResourceTemplate('memory://{scope}', { list: undefined }),
    {
      title: 'Memories',
      description: 'A collection of memories',
    },
    async (uri, { scope }) => {
      const result = await pgPool.query<Memory>(
        /* sql */ `
SELECT id, content, created_at, updated_at
FROM ${schema}.memory
WHERE scope = $1 AND deleted_at IS NULL
`,
        [scope],
      );

      return {
        contents: [
          {
            uri: uri.href,
            text: `Memories: scope=\`${scope}\`, count=${result.rows.length}
${result.rows.map((m) => `- (${m.id}) ${m.content}`).join('\n')}
`,
          },
        ],
      };
    },
  );
};
