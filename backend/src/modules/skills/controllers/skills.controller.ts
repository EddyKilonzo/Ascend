import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SkillsService } from '../services/skills.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('skills')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  /** Returns all skills with the caller's progress level and XP on each. */
  @Get()
  @ApiOperation({ summary: 'Get all skills with my progress' })
  getAllWithProgress(@CurrentUser() user: { id: string }) {
    return this.skillsService.getAllWithProgress(user.id);
  }
}
