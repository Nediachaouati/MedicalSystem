import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MailerService } from '@nestjs-modules/mailer';
import { UpdateUserDto } from './dto/update-user.dto';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';


@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private mailerService: MailerService,
  ) {}

  @Roles(Role.ADMIN, Role.PATIENT,Role.SECRETAIRE) // Ajout de Role.PATIENT
  @Get()
  async findUsersByRole(@Query('role') role: string) {
    if (!Object.values(Role).includes(role as Role)) {
      throw new BadRequestException(`Rôle invalide: ${role}`);
    }
    // Optionnel : Restreindre les données retournées pour les patients
    if (role === Role.MEDECIN) {
      return this.usersService.findUsersByRoles(role as Role);
    }
    // Seuls les admins peuvent voir les autres rôles
    const user = await this.usersService.findById((await this.usersService.findOneById(1)).id); // Simuler utilisateur connecté
    if (user.role !== Role.ADMIN) {
      throw new BadRequestException('Accès restreint aux administrateurs pour ce rôle');
    }
    return this.usersService.findUsersByRoles(role as Role);
  }

  @Roles(Role.ADMIN, Role.SECRETAIRE)
  @Get('ids')
  async findUsersByIds(@Query('ids') ids: string) {
    const idArray = ids.split(',').map(Number);
    if (idArray.some(isNaN)) {
      throw new BadRequestException('Les IDs doivent être des nombres valides');
    }
    return this.usersService.findByIds(idArray);
  }

  @Roles(Role.ADMIN, Role.MEDECIN)
  @Get('secretaries/:medecinId')
  async findSecretariesByMedecin(@Param('medecinId') medecinId: string) {
    return this.usersService.findSecretariesByMedecin(+medecinId);
  }

  @Roles(Role.ADMIN)
  @Get('secretaries')
  findAllSecretaries() {
    return this.usersService.findAllSecretaries();
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    const fullUser = await this.usersService.findById(user.id);
    return fullUser;
  }

  @Put('profile')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads/photos',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileExt = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${fileExt}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Seules les images sont autorisées (jpg, jpeg, png, gif)'), false);
        }
        cb(null, true);
      },
    }),
  )
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    return this.usersService.update(user.id, updateUserDto, photo);
  }

  @Roles(Role.ADMIN)
  @Post('add-medecin')
  async addMedecin(@Body() createUserDto: CreateUserDto) {
    const { user, plainPassword } = await this.usersService.createWithRole(createUserDto, Role.MEDECIN);

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Détails de votre compte Médecin',
        template: 'welcome-medecin',
        context: {
          name: user.name || 'MEDECIN',
          email: user.email,
          password: plainPassword,
        },
      });
      console.log('Email envoyé avec succès à', user.email);
    } catch (error) {
      console.error('Erreur lors de l’envoi de l’email :', error);
      throw error;
    }

    return user;
  }

  @Roles(Role.ADMIN)
  @Post('add-secretaire')
  async addSecretaire(@Body() createUserDto: CreateUserDto) {
    const { user, plainPassword } = await this.usersService.createWithRole(createUserDto, Role.SECRETAIRE);

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Détails de votre compte Secrétaire',
        template: 'welcome-secretaire',
        context: {
          name: user.name || 'SECRETAIRE',
          email: user.email,
          password: plainPassword,
        },
      });
      console.log('Email envoyé avec succès à', user.email);
    } catch (error) {
      console.error('Erreur lors de l’envoi de l’email :', error);
      throw error;
    }

    return user;
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    await this.usersService.softDeleteUser(+id);
    return { message: `Utilisateur avec l'ID ${id} supprimé avec succès` };
  }
  
@Get('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async getAdminStats() {
  const doctorsCount = await this.usersService.countByRole(Role.MEDECIN);
  const secretariesCount = await this.usersService.countByRole(Role.SECRETAIRE);

  console.log('DOCTEURS:', doctorsCount);     // ← AJOUTE ÇA
  console.log('SECRETAIRES:', secretariesCount); // ← AJOUTE ÇA

  const chartData = [
    { month: 'Jun', count: 5 },
    { month: 'Jul', count: 8 },
    { month: 'Aug', count: 12 },
    { month: 'Sep', count: 10 },
    { month: 'Oct', count: 15 },
    { month: 'Nov', count: 18 }
  ];

  return {
    doctors: doctorsCount,
    secretaries: secretariesCount,
    chartData
  };
}
}