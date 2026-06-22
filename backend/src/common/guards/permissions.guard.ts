import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * Maps each role to its allowed permissions.
 * ADMIN implicitly has all permissions. Add new permissions here as features grow.
 * This is an in-process map — no DB round-trip per request.
 */
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.ADMIN]: ['*'], // wildcard — all permissions granted
  [Role.MODERATOR]: [
    'habit:read', 'habit:create', 'habit:update', 'habit:delete',
    'goal:read',  'goal:create',  'goal:update',  'goal:delete',
    'planner:read', 'planner:create', 'planner:update', 'planner:delete',
    'focus:read', 'focus:create', 'focus:complete', 'focus:interrupt',
    'analytics:read',
    'leaderboard:read',
    'notifications:read', 'notifications:manage',
    'achievements:read',
    'skills:read',
    'badges:read',
  ],
  [Role.USER]: [
    'habit:read', 'habit:create', 'habit:update', 'habit:delete',
    'goal:read',  'goal:create',  'goal:update',  'goal:delete',
    'planner:read', 'planner:create', 'planner:update', 'planner:delete',
    'focus:read', 'focus:create', 'focus:complete', 'focus:interrupt',
    'analytics:read',
    'leaderboard:read',
    'notifications:read', 'notifications:manage',
    'achievements:read',
    'skills:read',
    'badges:read',
    'uploads:avatar',
    'social-tracker:read', 'social-tracker:log',
    'accountability:read', 'accountability:create', 'accountability:manage',
    'maya:read',
    'calendar:read', 'calendar:create', 'calendar:manage',
    'xp:read',
    'levels:read',
  ],
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    const role: Role        = user.role ?? Role.USER;
    const allowed: string[] = ROLE_PERMISSIONS[role] ?? [];

    // ADMIN wildcard
    if (allowed.includes('*')) return true;

    const hasAll = required.every((perm) => allowed.includes(perm));
    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions for this action');
    }

    return true;
  }
}
