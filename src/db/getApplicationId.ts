import db from './';

export const getProcessNo = async (): Promise<number> => {
  const res = await db.query('SELECT seq_process_no.NEXTVAL FROM dual;');
  return res[0][0]['NEXTVAL'];
};

export const getLoggerSeqNo = async (): Promise<number> => {
  const res = await db.query('SELECT sq_gen_logno.NEXTVAL FROM dual');
  return res[0][0]['NEXTVAL'];
};
