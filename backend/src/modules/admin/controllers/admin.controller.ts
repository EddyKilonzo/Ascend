import {
  Controller, Get, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from '../services/admin.service';
import { SetRoleDto } from '../dto/set-role.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { Role } from '@prisma/client';

/**
 * All routes in this controller require an authenticated user with Role.ADMIN.
 * The JwtAuthGuard validates the JWT; the RolesGuard enforces the ADMIN role.
 */
@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** Get paginated list of all registered users. */
  @Get('users')
  @ApiOperation({ summary: '[ADMIN] List all users' })
  @ApiQuery({ name: 'page',   required: false, type: Number })
  @ApiQuery({ name: 'limit',  required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  listUsers(
    @Query('page')   page   = 1,
    @Query('limit')  limit  = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers(Number(page), Number(limit), search);
  }

  /** Change a user's role (USER, MODERATOR, ADMIN). */
  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Change user role' })
  setRole(
    @CurrentUser() admin: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetRoleDto,
  ) {
    return this.adminService.setUserRole(id, dto.role, admin.id);
  }

  /** Activate or deactivate a user account. */
  @Patch('users/:id/active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Activate or deactivate a user' })
  setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.setUserActive(id, isActive);
  }

  /** Platform-wide statistics overview. */
  @Get('stats')
  @ApiOperation({ summary: '[ADMIN] Platform statistics' })
  getStats() {
    return this.adminService.getPlatformStats();
  }
}
