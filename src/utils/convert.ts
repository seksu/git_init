import { formatPartNo } from '@common/trim-shared';
import dayjs from 'dayjs'
const setFormatNumber = (field:string,decimal:number) => {
    return parseFloat(field).toFixed(decimal).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const setFormatDate = (inputDate:string) => {
    const parts = inputDate.split('/');
    const formattedDate = dayjs(`${parts[2]}-${parts[1]}-${parts[0]}`).format('YYYY-MM-DD');

    return formattedDate
};

const supplierCodeFormat = (supplier:string) => {
    if(!supplier) return supplier
    if(supplier.length > 4){
        
        return `${supplier.substring(0,4)}-${supplier.substring(4,supplier.length)}`
    }

    return supplier ;
}


export {
    setFormatNumber,
    setFormatDate,
   
    supplierCodeFormat
}