// import { TBMPrcChgReason } from '../models/tb-m-prc-chg-reason.model';
// import { TBMCustPlant } from '../models/tb-m-cust-plant.model';
import sequelize from 'sequelize';

const getDetailPriceCode = async () => {
    // const attributes = TBMPrcChgReason.getAttributes();
    // const entities = await TBMPrcChgReason.findAll({
    //   attributes: [
    //     [sequelize.literal("REASON_CD||':'||NVL(REMARK,' ')"), 'label'],
    //     [attributes.reasonCd.field, 'value'],
    //   ],
    //   order: ['value'],
    // });
    // return entities;

    return []
};

const getCustomerPlant = async () => {
  // const attributes = TBMCustPlant.getAttributes();
  // const entities = await TBMCustPlant.findAll({
  //   attributes: [
  //     [sequelize.literal("CUSTOMER_PLANT_CD || ' : ' || NVL(PLANT_NAME,' ')"), 'label'],
  //     [attributes.customerPlantCd.field, 'value'],
  //   ],
  //   order: ['value'],
  // });
  // return entities;
  return []
};

export default {
  getDetailPriceCode,
  getCustomerPlant
};
