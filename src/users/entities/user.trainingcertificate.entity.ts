import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';


@Entity({
  name: 'user_training'
})
export class UserTrainningEntity extends CustomBaseEntity {

 @ManyToOne(() => UserEntity, (user) => user.trainning_detail)
  user: UserEntity;

  @Column({ length: 100 })
  institute: string;

  @Column({ length: 100 })
  designationOfCourse: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'varchar', nullable: true })
  documentFile: string;
}
