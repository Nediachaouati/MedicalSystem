import { Role } from "src/role.enum";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
@PrimaryGeneratedColumn()
    id:number;

    @Column({unique:true})
    email:string;

    @Column({ nullable: true })
    password?: string;

    @Column({nullable:true})
    name:string;

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.PATIENT, 
    })
    role: Role; 

   /* @Column({ default: false }) // pour soft delete
    isDeleted: boolean;*/
    @Column({nullable:true})
    phoneNumber?: string;

    @Column({nullable:true})
    address?: string;

    @Column({ type: 'date', nullable: true })
    birthDate?: string;


    @Column({ nullable: true }) 
    photo?: string;

    @CreateDateColumn()
    created_at:Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn({ nullable: true })  // Soft delete column
    deleted_at: Date;

}
