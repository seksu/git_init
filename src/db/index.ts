import path from 'path';
import { Sequelize } from 'sequelize-typescript';
import oracle from 'oracledb';
import { sequelizeHelpers, logger } from '@common/be-core';

// prettier-ignore
const {
  DB_HOST,
  DB_PORT,
  DB_SID,
  DB_USER,
  DB_PASSWORD,
  DB_LOGGING,
  DB_INSTANCE_CLIENT,
} = process.env;

if (DB_INSTANCE_CLIENT) {
  oracle.initOracleClient({
    libDir: DB_INSTANCE_CLIENT,
  });
}

const db = new Sequelize(DB_SID, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: +DB_PORT || 1521,
  dialect: 'oracle',
  pool: {
    max: 20,
    min: 0,
    acquire: 1200000,
    idle: 1000000,
},
  dialectOptions: {
    useUTC: false,
    connectTimeout: 60000
  },
  timezone: '+07:00',
  models: [
    path.resolve(__dirname, '../models/**/*.model.{ts,js}'),
    path.resolve(path.dirname(require.resolve('@common/trim-shared')), './models/**/*.model.{ts,js}'),
  ],
  ...(DB_LOGGING !== 'true' && {
    logging: false,
  }),
});

db.authenticate().then(
  () => {
    logger.debug('Connection has been established successfully.');
  },
  (error) => {
    logger.warn(error, 'Unable to connect to the database');
  }
);

Object.values(db.models).forEach((model) => {
  (model as any).initialized?.();
  logger.debug(`Loaded model ${model.name}`);
});

sequelizeHelpers.setup(db);

export default db;
// export { default as bfw } from './bfw';
