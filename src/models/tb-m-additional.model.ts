import { Model, Table, PrimaryKey, Column, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'TB_M_ADDITIONAL',
  modelName: 'tb_m_additional',
  //timestamps: false,
})
export class TBMAdditional extends Model {
  @PrimaryKey
  @Column({
    field: 'PROJECT_CODE',
  })
  projectCode: string;

  @PrimaryKey
  @Column({
    field: 'PART_NO',
  })
  partNo: string;

  @PrimaryKey
  @Column({
    field: 'CODE',
  })
  code: string;

  @Column({
    field: 'DATA',
  })
  data: string;

  @Column({
    field: 'CREATE_BY',
  })
  createBy: string;

  @CreatedAt
  @Column({
    field: 'CREATE_DT',
  })
  createDt: Date;

}

export default TBMAdditional;
