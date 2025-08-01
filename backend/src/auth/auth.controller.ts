import { User } from 'src/users/entities/user.entity';
import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Role } from 'src/role.enum';


@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  async register(@Body() body: CreateUserDto) {
    const user = await this.usersService.create(body);
    return user;
  }

  // créer admin
  @Public() 
  @Post('create-admin')
  async createAdmin(@Body() body: CreateUserDto) {
    
    const secretKey = body['secretKey']; 
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      throw new Error('Invalid secret key');
    }

   
    const admin = await this.usersService.createWithRole(body, Role.ADMIN);
    return admin;
  }
}