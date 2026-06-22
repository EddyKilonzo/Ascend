import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class SetRoleDto {
  @ApiProperty({ enum: Role, example: Role.MODERATOR })
  @IsEnum(Role)
  role: Role;
}
