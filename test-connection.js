// Crear archivo: test-connection.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testConnection() {
  try {
    const result = await prisma.$queryRaw`SELECT version()`
    console.log('✅ ¡Conexión exitosa a Neon!')
    console.log('PostgreSQL version:', result[0].version)
  } catch (error) {
    console.error('❌ Error de conexión:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()