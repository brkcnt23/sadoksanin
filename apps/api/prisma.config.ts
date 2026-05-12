import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Load workspace-root .env (DATABASE_URL lives there, not in apps/api).
loadEnv({ path: path.resolve(__dirname, '../../.env') })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Prisma 7 requires datasource here for migrate / introspection commands.
  // Runtime client uses the PrismaPg adapter (see src/common/prisma.service.ts).
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
})
