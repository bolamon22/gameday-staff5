// Creates the AppSetting table in Turso
// Run with: node migrate-app-settings.js
const { createClient } = require('@libsql/client')
require('dotenv').config()

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function run() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "AppSetting" (
        "key"       TEXT     NOT NULL PRIMARY KEY,
        "value"     TEXT     NOT NULL,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ AppSetting table created (or already exists)')
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  }
}

run()
