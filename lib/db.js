import { PrismaClient } from "@prisma/client";

// Prevents exhausting DB connections from hot-reload in dev.
const globalForPrisma = globalThis;

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
