import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Auth, GetUser } from '../auth/decorators';
import { User } from 'src/user/entities/user.entity';
import { SavedViewsService } from './saved-views.service';
import { CreateSavedViewDto } from './dto/create-saved-view.dto';

@ApiTags('Saved Views')
@ApiBearerAuth()
@Auth()
@Controller('saved-views')
export class SavedViewsController {
  constructor(private readonly savedViewsService: SavedViewsService) {}

  @Get()
  @ApiOperation({ summary: 'List the current user\'s saved views' })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@GetUser() user: User) {
    return this.savedViewsService.findAll(user.id);
  }

  @Post()
  @ApiOperation({
    summary:
      'Create a saved view (name + search text + sort order) owned by the current user',
  })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@GetUser() user: User, @Body() dto: CreateSavedViewDto) {
    return this.savedViewsService.create(user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete one of the current user\'s saved views' })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@GetUser() user: User, @Param('id') id: string) {
    return this.savedViewsService.remove(user.id, id);
  }
}
