import { Model, Table, PrimaryKey, Column, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'TB_M_SYSTEM',
  modelName: 'tb_m_system',
  //timestamps: false,
})
export class TBMSystem extends Model {
  @PrimaryKey
  @Column({
    field: 'CATEGORY',
  })
  category: string;

  @PrimaryKey
  @Column({
    field: 'SUB_CATEGORY',
  })
  subCategory: string;

  @PrimaryKey
  @Column({
    field: 'CD',
  })
  cd: string;

  @Column({
    field: 'VALUE',
  })
  value: string;

  @Column({
    field: 'VALUE2',
  })
  value2: string;

  @Column({
    field: 'REMARK',
  })
  remark: string;

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
  createDt: Date;

  @Column({
    field: 'MODIFY_BY',
  })
  modifyBy: string;

  @UpdatedAt
  @Column({
    field: 'MODIFY_DT',
  })
  modifyDt: Date;
}

export default TBMSystem;
