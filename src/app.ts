import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import createHttpError from 'http-errors';
import httpStatus from 'http-status';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { pick } from 'lodash';
import { logger } from '@common/be-core';
import { authorized } from '@common/trim-shared/middleware';
import routes from './routes';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

dayjs.tz.setDefault('Asia/Bangkok');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet());
app.use(compression());
app.disable('x-powered-by');

app.use(`/api/psmr`, authorized(), routes);

// catch 404 and forward to error handler
app.use((_req, _res, next) => {
  next(createHttpError(httpStatus.NOT_FOUND));
});

// error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error, _req, res, _next) => {
  const statusCode = error.status || httpStatus.INTERNAL_SERVER_ERROR;
  const message = error.message || httpStatus[statusCode];
  const info = pick(error, ['details', 'errors', 'code', 'value']);

  if (statusCode >= httpStatus.INTERNAL_SERVER_ERROR) {
    // TODO: set request data.
    logger.error(error);
  }

  res.status(statusCode).json({
    statusCode,
    message,
    ...info,
  });
});

export default app;
