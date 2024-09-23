import { Model, Table, PrimaryKey, Column, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'TB_R_MAPPING_INFO',
  modelName: 'tb_r_mapping_info',
  //timestamps: false,
})
export class TBRMappingInfo extends Model {
  @PrimaryKey
  @Column({ field: 'CAR_FAMILY_CODE', })
  carFamilyCode: string;

  @PrimaryKey
  @Column({ field: 'STAGE', })
  stage: string;

  @Column({ field: 'STATUS', })
  status: string;

  @Column({ field: 'CREATE_BY', })
  createBy: string;

  @CreatedAt
  @Column({ field: 'CREATE_DT', })
  createDt: Date;

  @Column({ field: 'MODIFY_BY', })
  modifyBy: string;

  @UpdatedAt
  @Column({ field: 'MODIFY_DT', })
  modifyDt: Date;
}

export default TBRMappingInfo;
