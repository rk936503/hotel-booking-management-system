import dotenv from 'dotenv';
dotenv.config();
import { beforeAll, afterAll } from 'vitest';
import prisma from '../config/database';

beforeAll(async () => {
  // Ensure database connection is active
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
