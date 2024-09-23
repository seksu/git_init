import message from './json/message.json'

export const getMessage = async (messageCd:string, paramArr?:Array<any>): Promise<string> => {

    let varMessage = message[messageCd].message
    if(paramArr && paramArr.length > 0){
        const varMessageLength = message[messageCd].message.match(/\[/g)?.length        
        for (let index = 0; index < varMessageLength; index++) {
            if(paramArr[index]){
                varMessage = varMessage.replace('[' + index + ']', paramArr[index])
            }
        }
    }
    return varMessage
};
