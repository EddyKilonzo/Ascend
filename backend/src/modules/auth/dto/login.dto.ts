import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'SecurePass@123' })
  @IsString()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({ description: 'TOTP code if 2FA is enabled', example: '123456' })
  @IsOptional()
  @IsString()
  totpCode?: string;
}
