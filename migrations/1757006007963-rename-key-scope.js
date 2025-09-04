import { Client } from 'pg';

const schema = process.env.DB_SCHEMA || 'tiger_memory';

export const description = 'Rename key column to scope in memory table';

export async function up() {
  const client = new Client();

  try {
    await client.connect();
    await client.query(/* sql */ `
      ALTER TABLE ${schema}.memory RENAME COLUMN key TO scope;
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
      ALTER TABLE ${schema}.memory RENAME COLUMN scope TO key;
    `);
  } finally {
    await client.end();
  }
}
