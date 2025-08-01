import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('User from request:', user);
    console.log('Required roles:', requiredRoles);

    // Si aucun rôle n'est requis, autoriser l'accès
    if (!requiredRoles) {
      console.log('No roles required, access granted');
      return true;
    }

    // Vérifier si l'utilisateur a l'un des rôles requis
    const hasRole = requiredRoles.some((role) => user?.role === role);
    console.log('Has required role:', hasRole);
    return hasRole;
  }
}
