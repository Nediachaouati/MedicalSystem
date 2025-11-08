import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationsService } from '../Notification/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  async findUsersByRoles(role: Role): Promise<User[]> {
    return this.usersRepository.find({
      where: { role },
    });
  }

  async softDeleteUser(id: number): Promise<void> {
    await this.usersRepository.softDelete(id);
  }

  async findOneById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }
    return user;
  }

  async findByIds(ids: number[]): Promise<User[]> {
    return this.usersRepository.find({
      where: { id: In(ids) },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto, photo?: Express.Multer.File): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    if (user.role === Role.PATIENT || user.role === Role.MEDECIN) {
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

    if (photo) {
      user.photo = `Uploads/photos/${photo.filename}`;
    }

    await this.usersRepository.save(user);
    delete user.password;
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const { email, password, name, phoneNumber, address, birthDate } = dto;

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
    const { email, password, name, medecinId,speciality } = dto;

    let medecin: User | undefined;
    if (role === Role.SECRETAIRE && medecinId) {
      medecin = await this.findOneById(medecinId);
      if (medecin.role !== Role.MEDECIN) {
        throw new BadRequestException('L’utilisateur assigné doit être un médecin.');
      }
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      name,
      role,
      speciality: role === Role.MEDECIN ? speciality : undefined,
      medecinId: role === Role.SECRETAIRE ? medecinId : undefined,
      medecin: role === Role.SECRETAIRE ? medecin : undefined,
    });

    const newUser = await this.usersRepository.save(user);

    if (role === Role.SECRETAIRE && medecin) {
  await this.notificationsService.createNotification(
    medecin.id,
    `Le secrétaire ${name} vous a été assigné.`
  );
  await this.notificationsService.createNotification(
    newUser.id,
    `Vous avez été assigné au médecin ${medecin.name}.`
  );
}

    delete (newUser as any).password;
    return { user: newUser, plainPassword: password };
  }


  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }
    return user;
  }

  async delete(id: number): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }
    await this.usersRepository.delete(id);
  }

  async findSecretariesByMedecin(medecinId: number): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: Role.SECRETAIRE, medecinId, deleted_at: IsNull() },
    });
  }

  async findAllSecretaries(): Promise<User[]> {
    return this.usersRepository.find({ where: { role: Role.SECRETAIRE } });
  }

 async countByRole(role: Role): Promise<number> {
  return this.usersRepository.count({ where: { role } });
}

}





