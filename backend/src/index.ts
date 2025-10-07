import http from 'http';
import { app } from './server/app.js';
import { env } from './server/config/env.js';
import { initializeSocketIO } from './services/alerts.js';

const port = env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO for real-time notifications
initializeSocketIO(server);

// Start server
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 NeoCure backend listening on port ${port}`);
  console.log(`📊 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔌 WebSocket server ready for real-time alerts`);
});
