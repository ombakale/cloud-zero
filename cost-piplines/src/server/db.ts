import { store } from './store.ts';

// Clean DB abstraction without Prisma or MSSQL
export const prisma: any = new Proxy({}, {
  get(target, prop) {
    return {
      findMany: async () => [],
      findFirst: async () => null,
      findUnique: async () => null,
      create: async (args: any) => args.data || {},
      createMany: async () => ({ count: 0 }),
      update: async (args: any) => args.data || {},
      delete: async () => ({}),
      deleteMany: async () => ({ count: 0 }),
      $queryRawUnsafe: async () => [],
      $disconnect: async () => {},
    };
  }
});

export function getPrismaClient(): any {
  return prisma;
}

export { store };
export default store;
