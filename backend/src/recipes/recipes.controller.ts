import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Auth, GetUser } from '../auth/decorators';
import { User } from 'src/user/entities/user.entity';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@ApiTags('Recipes')
@ApiBearerAuth()
@Auth()
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @ApiOperation({ summary: 'List the current user\'s recipes (newest first)' })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@GetUser() user: User) {
    return this.recipesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of the current user\'s recipes by id' })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@GetUser() user: User, @Param('id') id: string) {
    return this.recipesService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a recipe owned by the current user' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@GetUser() user: User, @Body() dto: CreateRecipeDto) {
    return this.recipesService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update one of the current user\'s recipes' })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(@GetUser() user: User, @Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    return this.recipesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete one of the current user\'s recipes' })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@GetUser() user: User, @Param('id') id: string) {
    return this.recipesService.remove(user.id, id);
  }
}
