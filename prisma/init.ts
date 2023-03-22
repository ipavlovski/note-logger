import { readFile } from 'node:fs/promises'
import { Category, PrismaClient, Tag } from '@prisma/client'

const prisma = new PrismaClient()
