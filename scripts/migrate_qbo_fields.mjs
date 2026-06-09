import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function run() {
  for (const col of ['qboInvoiceId', 'qboCustomerId']) {
    try {
      await client.execute(`ALTER TABLE TeamRegistration ADD COLUMN ${col} TEXT NOT NULL DEFAULT ''`)
      console.log(`Added ${col}`)
    } catch (e) {
      if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
        console.log(`${col} already exists`)
      } else throw e
    }
  }
  console.log('Migration complete')
}
run().catch(console.error)
