import path from 'path';
import pino, { levels } from 'pino';

const { LOG_LEVEL = 'info' } = process.env;

const logger = pino({
  level: LOG_LEVEL,
  transport: {
    targets: [
      {
        level: levels.values[LOG_LEVEL] >= levels.values.info ? LOG_LEVEL : 'info',
        target: 'pino/file',
        options: {
          destination: path.resolve(__dirname, '../../logs/app.log'),
          mkdir: true,
          append: false,
        },
      },
      {
        level: LOG_LEVEL,
        target: 'pino-pretty',
        options: {},
      },
    ],
  },
});

export default logger;
