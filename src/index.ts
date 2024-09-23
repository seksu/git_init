import 'dotenv/config';
import http from 'http';
import { logger } from '@common/be-core';
import * as db from './db';
import app from './app';

const port = +process.env.PORT! || 3000;
const server = http.createServer(app);

server.listen(port, () => {
  logger.info(`Listening on port ${port}`);
});

const quit = () => {
  db.default.close();
  // db.bfw.close();
  server.close();
};

process.on('SIGINT', quit);
process.on('SIGTERM', quit);
