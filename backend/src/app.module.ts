import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AppointmentModule } from './appointment/appointment.module';
/*import { SymptomModule } from './symptom/symptom.module';*/
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './Notification/notifications.module';
import { SymptomModule } from './symptom/symptom.module';
import { PrescriptionModule } from './prescription/prescription.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, 
        auth: {
          user: process.env.EMAIL_USER, 
          pass: process.env.EMAIL_PASSWORD, 
        },
      },
      defaults: {
        from: '"emailverif" <nediachaouati39@gmail.com>',
      },
      template: {
        dir: join(__dirname, 'templates'), 
        adapter: new HandlebarsAdapter(), 
        options: {
          strict: true,
        },
      },
    }),
    
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'db-medical',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    
     AuthModule, UsersModule, AppointmentModule, ChatModule ,NotificationsModule,SymptomModule, PrescriptionModule,],
  controllers: [AppController],
  providers: [
    AppService,{
      provide: APP_GUARD,
      useClass:JwtAuthGuard,
    },
  ],
})
export class AppModule {}



