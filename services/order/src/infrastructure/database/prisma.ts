import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { DEV_DEFAULT_DATABASE_URL } from "@orderly/utils";

const connectionString = process.env.DATABASE_URL || DEV_DEFAULT_DATABASE_URL;
const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });