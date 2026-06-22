import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AccountabilityService, CreateCommitmentDto } from '../services/accountability.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { CommitmentStatus } from '@prisma/client';

@ApiTags('accountability')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('accountability/commitments')
export class AccountabilityController {
  constructor(private readonly accountabilityService: AccountabilityService) {}

  /** Create a new public commitment with an XP stake. */
  @Post()
  @ApiOperation({ summary: 'Create a new commitment' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateCommitmentDto) {
    return this.accountabilityService.create(user.id, dto);
  }

  /** Get paginated commitments, optionally filtered by status. */
  @Get()
  @ApiOperation({ summary: 'Get my commitments' })
  @ApiQuery({ name: 'page',   required: false, type: Number })
  @ApiQuery({ name: 'limit',  required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: CommitmentStatus })
  findAll(
    @CurrentUser()             user:   { id: string },
    @Query('page')   page   = 1,
    @Query('limit')  limit  = 20,
    @Query('status') status?: CommitmentStatus,
  ) {
    return this.accountabilityService.findAll(user.id, Number(page), Number(limit), status);
  }

  /** Mark a commitment as completed and earn bonus XP. */
  @Patch(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a commitment as completed' })
  complete(
    @CurrentUser()                  user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.accountabilityService.complete(id, user.id);
  }

  /** Mark a commitment as failed with an optional note. */
  @Patch(':id/fail')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a commitment as failed' })
  fail(
    @CurrentUser()                  user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body('failureNote')        failureNote?: string,
  ) {
    return this.accountabilityService.fail(id, user.id, failureNote);
  }
}
