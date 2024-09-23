import { Column, Model, Table, PrimaryKey, CreatedAt, BeforeBulkCreate } from 'sequelize-typescript';

@Table({
  tableName: 'TB_P_UPLOAD',
  modelName: 'TB_P_UPLOAD',
  timestamps: false
})
export class TBPUpload extends Model {
  @PrimaryKey
  @Column({
    field: 'ID',
  })
  id: string;

  @Column({
    field: 'APP_ID',
  })
  appId: number;

  @Column({
    field: 'ROW_INDX',
  })
  rowIndex: number;

  @Column({
    field: 'COL_NAME',
  })
  column: string;

  @Column({
    field: 'ERROR_MESSAGE',
  })
  errorMessage: string;

  @CreatedAt
  @Column({
    field: 'CREATE_DT',
  })
  createDt: Date;


   @BeforeBulkCreate
  static handleBeforeBulkCreate(instances) {
    // for (let instance of instances){
    //   delete instance.dataValues.rowId;
    // }
  }

}

export default TBPUpload;
