import { Client } from 'pg';

const schema = process.env.DB_SCHEMA || 'tiger_memory';

export const description = 'Add a source column for memories';

export async function up() {
  const client = new Client();

  try {
    await client.connect();
    await client.query(/* sql */ `
      ALTER TABLE ${schema}.memory ADD COLUMN source TEXT DEFAULT NULL;
    `);
  } finally {
    await client.end();
  }
}

export async function down() {
  const client = new Client();

  try {
    await client.connect();
    await client.query(/* sql */ `
      ALTER TABLE ${schema}.memory DROP COLUMN source;
    `);
  } finally {
    await client.end();
  }
}
