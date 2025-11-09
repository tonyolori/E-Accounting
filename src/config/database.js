const { PrismaClient } = require('@prisma/client');

// Create singleton instance of Prisma client
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances during development with hot reloading
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

// Test database connection
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
}

// Handle application shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
});

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase
};
