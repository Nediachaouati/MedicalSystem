import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from 'src/role.enum';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

 /*
  // Filtrer les utilisateurs par rôles (RH ou CANDIDAT)
  async findUsersByRoles(roles: Role[], query: any): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: In(roles) },
      ...query,  
    });
  }
*/


  async softDeleteUser(id: number): Promise<void> {
    await this.usersRepository.softDelete(id); // Marks the user as deleted
  }
  // Récupérer un utilisateur par ID
  async findOneById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }
    return user;
  }


  //update user
  async update(id: number, updateUserDto: UpdateUserDto, photo?: Express.Multer.File): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    if (user.role === Role.PATIENT) {
      if (updateUserDto.email !== undefined) user.email = updateUserDto.email;
      if (updateUserDto.name !== undefined) user.name = updateUserDto.name;
      if (updateUserDto.phoneNumber !== undefined) user.phoneNumber = updateUserDto.phoneNumber;
      if (updateUserDto.address !== undefined) user.address = updateUserDto.address;
      if (updateUserDto.birthDate !== undefined) user.birthDate = updateUserDto.birthDate;
      
    } else if (user.role === Role.MEDECIN) {
      if (updateUserDto.email !== undefined) user.email = updateUserDto.email;
      if (updateUserDto.name !== undefined) user.name = updateUserDto.name;
      if (updateUserDto.phoneNumber !== undefined) user.phoneNumber = updateUserDto.phoneNumber;
      if (updateUserDto.address !== undefined) user.address = updateUserDto.address;
      if (updateUserDto.birthDate !== undefined) user.birthDate = updateUserDto.birthDate;
    }

    if (updateUserDto.password !== undefined) {
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(updateUserDto.password, salt);
    }
    //photo
    if (photo) {
    user.photo = `uploads/photos/${photo.filename}`;
    }

    await this.usersRepository.save(user);
    delete user.password;
    return user;
  }

  

  //register patient
  async create(dto: CreateUserDto): Promise<User> {
    const { email, password, name ,phoneNumber ,address, birthDate } = dto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      name,
      phoneNumber,
      address,
      birthDate,
      role: Role.PATIENT, 
    });

    const newUser = await this.usersRepository.save(user);
    delete newUser.password; 
    return newUser;
  }

  async findOne(email: string, selectSecrets: boolean = false): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true, 
        password: selectSecrets,
      },
    });
  }

async createWithRole(dto: CreateUserDto, role: Role): Promise<{ user: User; plainPassword: string }> {
  const { email, password, name } = dto;

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = this.usersRepository.create({
    email,
    password: hashedPassword,
    name,
    role: role,
  });

  const newUser = await this.usersRepository.save(user);
  delete newUser.password; 
  return { user: newUser, plainPassword: password }; 
}

//recuperer tous le champs de userprofile
async findById(id: number): Promise<User> {
  const user = await this.usersRepository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
  }
  return user;
}

//delete user
  async delete(id: number): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }
    await this.usersRepository.delete(id);
  }

  
}
