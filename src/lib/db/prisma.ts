import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const accelerateUrl =
  process.env.PRISMA_ACCELERATE_URL && process.env.PRISMA_ACCELERATE_URL.trim().length > 0
    ? process.env.PRISMA_ACCELERATE_URL
    : "prisma://localhost?api_key=dummy";

const prismaClientOptions = {
  accelerateUrl,
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
