import {logger} from '@common/be-core';
import db from '../db'
import { MessageTypeLog, StatusHLog, StatusLog } from '../types/logs';
import TBLHeader from '../models/dblogs/tb-l-header.model';
import TBLLogger from '../models/dblogs/tb-l-logger.model';

export const getProcessNo = async (): Promise<number> => {
    const res = await db.query('SELECT seq_process_no.NEXTVAL FROM dual;')
    return res[0][0]["NEXTVAL"]
};

export const getLoggerSeqNo = async (): Promise<number> => {
    const res = await db.query('SELECT sq_gen_logno.NEXTVAL FROM dual')
    return res[0][0]["NEXTVAL"]
};

export const writeHeaderLog = async (processNo:number, processDt:Date, moduleId:string, functionId:string, historyFile:string, status:StatusHLog, createBy:string): Promise<void> => {
    const logHeaderData = {
        processNo : processNo,
        processDt : processDt,
        moduleId : moduleId,
        functionId : functionId,
        historyFile : historyFile,
        status : status,
        createBy : createBy,
        createDt : new Date()
    }
    await TBLHeader.create(logHeaderData)
};

export const updateHeaderLog = async (processNo:number, status:string): Promise<void> => {
    await TBLHeader.update(
        { status: status },
        { where: { processNo: processNo } }
    )
};

export const writeDetailLog = async (functionId:string, moduleId:string, messageType:MessageTypeLog, message:string, messageCd:string, status:StatusLog, appId:number, createBy:string): Promise<void> => {
    
    const logData = {
        vFunctionId: functionId,
        vModuleId: moduleId,
        vMessageType: messageType,
        vMessage: message,
        nSeqNo: await getLoggerSeqNo(),
        vMessageCode: messageCd,
        vStatus: status,
        vAplId: appId,
        vUsercre: createBy,
        dHodtcre: new Date()
    }
    logger.info(logData)
    if(messageType === 'E'){
        logger.error(logData)
    }
    await TBLLogger.create(logData)
};