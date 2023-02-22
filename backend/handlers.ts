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

export async function getEntries(query: string) {
  console.log(`Need to handle ${query} properly`)
  return await prisma.entry.findMany()
}


export async function getAllTags() {
  return await prisma.tag.findMany({ select: { name: true } })
}

export async function createNewTag(name: string) {
  await prisma.tag.create({ data: { name } })
}

export async function updateTagName({ newName, oldName }: { oldName: string; newName: string }) {
  await prisma.tag.update({ where: { name: oldName }, data: { name: newName } })
}

export async function deleteTag(name: string) {
  await prisma.tag.delete({ where: { name } })
}