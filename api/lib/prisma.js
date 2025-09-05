import { PrismaClient } from '../../generated/prisma/client.js';

const g = global;
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
