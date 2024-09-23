import { Model, Table, PrimaryKey, Column, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'TB_M_PROJECT',
  modelName: 'tb_m_project',
  //timestamps: false,
})
export class TBMProject extends Model {
  @PrimaryKey
  @Column({ field: 'PROJECT_CD', })
  projectCode: string;
  @Column({ field: 'PROJECT_NAME', })
  projectName: string;  
  @Column({ field: 'SOP_DT', })
  sopDate: Date;
  @Column({ field: 'ISSUE_DATE', })
  issueDate: string;
  @Column({ field: 'FAMILY_CD', })
  carFamilyCode: string;
  @Column({ field: 'TD_PROJECT', })
  tdProject: string
  @Column({ field: 'PART_LIFE', })
  partLife: number
  @Column({ field: 'DISPLAY_FLAG', })
  displayFlag: string
  @Column({ field: 'EXPIRE_FLAG', })
  expireFlag: string
  @Column({ field: 'CREATE_BY', })
  createBy: string;
  @Column({ field: 'CREATE_DT', })
  createDt: Date;
  @Column({ field: 'MODIFY_BY', })
  modifyBy: string
  @Column({ field: 'MODIFY_DT', })
  modifyDt: Date
}

export default TBMProject;
