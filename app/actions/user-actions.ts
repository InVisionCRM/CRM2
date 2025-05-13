"use server"

import { prisma } from "@/lib/db"

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return { users }
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return { users: [] }
  }
}