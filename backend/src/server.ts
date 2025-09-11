import app from './app';
import { env, isDevelopment } from './config/env';
import { checkDatabaseConnection, closeDatabaseConnection } from './db/connection';

// Check database connection before starting server
async function startServer() {
  try {
    // Check database connection
    const isDbConnected = await checkDatabaseConnection();
    if (!isDbConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
    
    // Start the server
    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Server is running on http://${env.HOST}:${env.PORT}`);
      console.log(`📊 Health check available at http://${env.HOST}:${env.PORT}/health`);
      console.log(`🔗 API available at http://${env.HOST}:${env.PORT}/api`);
      
      if (isDevelopment) {
        console.log(`🎯 Environment: ${env.NODE_ENV}`);
        console.log(`💾 Database: ${env.DB_NAME} on ${env.DB_HOST}:${env.DB_PORT}`);
      }
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  await closeDatabaseConnection();
  process.exit(0);
});
