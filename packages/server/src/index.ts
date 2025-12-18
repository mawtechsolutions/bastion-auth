import { createApp } from './app.js';
import { env } from './config/index.js';

async function main() {
  const app = await createApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`
🏰 BastionAuth API Server

   Server:  http://${env.HOST}:${env.PORT}
   Docs:    http://${env.HOST}:${env.PORT}/docs
   Health:  http://${env.HOST}:${env.PORT}/health

   Environment: ${env.NODE_ENV}
`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, () => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    process.exit(0);
  });
});

main();

