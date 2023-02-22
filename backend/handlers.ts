import { PrismaClient } from '@prisma/client'
import { randomUUID as uuidv4 } from 'node:crypto'
import { writeFile, mkdir } from 'node:fs/promises'
import { STORAGE_DIRECTORY } from 'backend/config'
import { setTimeout, } from 'timers/promises'
const prisma = new PrismaClient()

type User = { id: string, name: string }
const users: User[] = [{ id: '123', name: 'test-1' }, { id: '456', name: 'test-2' }]

export async function getUserByName(name: string) {
  await setTimeout(100)
  const user = users.find((v) => v.name == name)
  if (! user) throw new Error('must have a user with this name')
  return user

}

export async function addUser(name: string) {
  await setTimeout(100)
  const newUser = { id: uuidv4(), name }
  users.push(newUser)
  return newUser
}