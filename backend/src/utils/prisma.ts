import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg'; // Import the native Postgres driver pool
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;

// 1. Create a Postgres Pool with SSL explicitly enabled
// Render requires 'ssl: true' or specific SSL options.
const pool = new Pool({ 
  connectionString,
  ssl: {
    rejectUnauthorized: false, // This allows connection even if Render's cert isn't perfectly verified locally (common fix)
  },
});

// 2. Pass the pool to the Prisma Adapter
const adapter = new PrismaPg(pool);

// 3. Initialize Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;