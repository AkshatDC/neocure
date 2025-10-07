import http from 'http';
import { app } from './server/app.js';
import { env } from './server/config/env.js';

const port = env.PORT || 4000;

const server = http.createServer(app);

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`NeoCure backend listening on port ${port}`);
});
