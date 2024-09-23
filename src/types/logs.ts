//info, error
export type MessageTypeLog = 'I' | 'E';

//start, process, end
export type StatusLog = 'S' | 'P' | 'E'

//SUCCESS, ERROR
export type StatusHLog = 'SUCCESS' | 'ERROR'

//0 = success, 1 = error
export type InterfaceStatus = 0 | 1

export type InterFaceLog = {
    processNo:number;
    startDt:Date; 
    endDt:Date; 
    systemCd:string; 
    interfaceCd:string; 
    recordCount:number; 
    transAmt:number; 
    interfaceStatus:InterfaceStatus; 
    createBy:string;
}