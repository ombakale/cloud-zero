import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded before checking DATABASE_URL
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

let prismaInstance: any = null;

// Safely attempt dynamic import of Prisma without breaking if Prisma isn't generated or on Node < 20.19
let PrismaClient: any = null;
let PrismaMssql: any = null;

try {
  const prismaClientModule = await import('@prisma/client');
  PrismaClient = prismaClientModule.PrismaClient;
  const adapterModule = await import('@prisma/adapter-mssql');
  PrismaMssql = adapterModule.PrismaMssql;
} catch (e: any) {
  // Gracefully handled - server will fall back to local file datasets
}

export function getPrismaClient(): any {
  if (!prismaInstance && PrismaClient) {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const adapter = PrismaMssql ? new PrismaMssql(dbUrl) : undefined;
        prismaInstance = adapter ? new PrismaClient({ adapter }) : new PrismaClient();
        console.log('🗄️ [SQL Server] Connected Prisma Client for Cost Intelligence');
      } catch (dbInitErr: any) {
        console.error('❌ [SQL Server] Failed to initialize Prisma Client:', dbInitErr.message);
      }
    } else {
      console.warn('⚠️ [SQL Server] DATABASE_URL not found in environment.');
    }
  }
  return prismaInstance;
}

// Eager initialization on module load if DATABASE_URL is present
getPrismaClient();

// Proxy export for backwards compatibility with `prisma.model.method()`
export const prisma = new Proxy({} as any, {
  get(target, prop) {
    const client = getPrismaClient();
    if (!client) {
      return undefined;
    }
    return client[prop];
  }
});

export default prisma;
