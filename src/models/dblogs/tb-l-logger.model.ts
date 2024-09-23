import { Column, Model, Table, PrimaryKey } from 'sequelize-typescript';

@Table({
    tableName: 'TB_L_LOGGER',
    timestamps: false,
})
export class TBLLoger extends Model {
    @Column({
      field: 'V_FUNCTION_ID',
    })
    vFunctionId: string;

    @Column({
        field: 'V_MODULE_ID',
    })
    vModuleId: string;

    @Column({
        field: 'V_MESSAGE_TYPE',
    })
    vMessageType: string;

    @Column({
        field: 'V_MESSAGE',
    })
    vMessage: string;

    @PrimaryKey
    @Column({
        field: 'N_SEQ_NO',
    })
    nSeqNo: number;

    @Column({
        field: 'V_MESSAGE_CODE',
    })
    vMessageCode: string;

    @Column({
        field: 'V_STATUS',
    })
    vStatus: string;

    @Column({
        field: 'V_APL_ID',
    })
    vAplId: string;

    @Column({
        field: 'V_USERCRE',
    })
    vUsercre: string;

    @Column({
        field: 'D_HODTCRE',
    })
    dHodtcre: Date;

}
  
export default TBLLoger;