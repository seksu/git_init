import { Column, Model, Table, PrimaryKey, CreatedAt, BeforeBulkCreate, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'TB_L_UPLOAD',
  modelName: 'TB_L_UPLOAD',
  timestamps: false
})
export class TBLUploadStatus extends Model {
  @PrimaryKey
  @Column({
    field: 'APP_ID',
  })
  appId: number;

  @Column({
    field: 'BATCH_ID',
  })
  batchId: string;

  @Column({
    field: 'FILE_NAME',
  })
  fileName: string;

  @Column({
    field: 'TOTAL_RECORD',
  })
  total: number;

  @Column({
    field: 'COMPLETED_RECORD',
  })
  complete: number;

  @Column({
    field: 'ERROR_RECORD',
  })
  error: number;
  @Column({
    field: 'REPORT_FILE_NAME',
  })
  reportFileName: string;
  @Column({
    field: 'STATUS',
  })
  status: string;

  @Column({
    field: 'CREATE_BY',
  })
  createBy: string;

  @CreatedAt
  @Column({
    field: 'CREATE_DT',
  })
  createDate: Date;


  @Column({
    field: 'UPDATE_BY',
  })
  updateBy: Date;
  
  @UpdatedAt
  @Column({
    field: 'UPDATE_DT',
  })
  updateDate: Date;
 

   @BeforeBulkCreate
  static handleBeforeBulkCreate(instances) {
    // for (let instance of instances){
    //   delete instance.dataValues.rowId;
    // }
  }

}

export default TBLUploadStatus;
