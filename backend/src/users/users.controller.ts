import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FindUsersDto } from './dto/find-users.dto';
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
export class UsersController {
  constructor(private usersService: UsersService,
    private mailerService: MailerService,
  ) {}


/*
  // lister et filtrer uniquement les RH
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('rh')
  findRH(@Query('search') search?: string) {
    return this.usersService.findUsersByRoles([Role.RH], search);
  }


  // lister et filtrer uniquement les Candidats
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('candidats')
  findCandidats(@Query('search') search?: string) {
    return this.usersService.findUsersByRoles([Role.CANDIDAT], search);
  }
*/


  //get-profile
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User) {
  const fullUser = await this.usersService.findById(user.id);
  return fullUser;
}

  // update profile users
  @UseGuards(JwtAuthGuard)
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

  // add medecin 
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('add-medecin')
  async addMedecin(@Body() createUserDto: CreateUserDto) {
  const { user, plainPassword } = await this.usersService.createWithRole(createUserDto, Role.MEDECIN);

  try {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Détails de votre compte Médecin',
      template: 'welcome-doctor',
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

  // delete user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    await this.usersService.softDeleteUser(+id);
    return { message: `Utilisateur avec l'ID ${id} supprimé avec succès` };
  }

}