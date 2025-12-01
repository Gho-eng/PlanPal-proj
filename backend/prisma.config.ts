// prisma.config.ts

import 'dotenv/config'; // Crucial: Loads your DATABASE_URL from the .env file
import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma', 

  datasource: {
    url: env('DATABASE_URL'), 
  },
});