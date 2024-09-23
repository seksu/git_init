import { Column, Model, Table, PrimaryKey } from 'sequelize-typescript';

@Table({
    tableName: 'TB_L_HEADER',
    timestamps: false,
})
export class TBLHeader extends Model {
    @PrimaryKey
    @Column({
      field: 'PROCESS_NO',
    })
    processNo!: number;
  
    @PrimaryKey
    @Column({
      field: 'PROCESS_DT',
    })
    processDt!: Date;

    @Column({
      field: 'MODULE_ID',
    })
    moduleId: string;

    @Column({
      field: 'FUNCTION_ID',
    })
    functionId: string;

    @Column({
      field: 'HISTORY_FILE',
    })
    historyFile: string;

    @Column({
      field: 'STATUS',
    })
    status: string;
  
    @Column({
      field: 'CREATE_BY',
    })
    createBy: string;
  
    @Column({
      field: 'CREATE_DT',
    })
    createDt: Date;
}
  
export default TBLHeader;