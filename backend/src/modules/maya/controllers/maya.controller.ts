import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MayaService } from '../services/maya.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('maya')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('maya')
export class MayaController {
  constructor(private readonly mayaService: MayaService) {}

  /** Returns Maya's personalized AI-backed productivity suggestions for the caller. */
  @Get('suggestions')
  @ApiOperation({ summary: 'Get Maya AI productivity suggestions' })
  getSuggestions(@CurrentUser() user: { id: string }) {
    return this.mayaService.getSuggestions(user.id);
  }
}
