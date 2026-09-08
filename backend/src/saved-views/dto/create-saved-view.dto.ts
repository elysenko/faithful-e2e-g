import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

import { RECIPE_SORTS, RecipeSort } from '../../recipes/dto/query-recipes.dto';

export class CreateSavedViewDto {
  @ApiProperty({
    description: 'Name of the saved view',
    nullable: false,
    required: true,
    type: 'string',
    example: 'Quick breakfasts',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({
    description: 'Search text stored with the view (defaults to an empty string)',
    type: 'string',
    example: 'banitsa',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort order stored with the view: `newest` (default) or `title`',
    enum: RECIPE_SORTS,
    example: 'newest',
  })
  @IsIn(RECIPE_SORTS)
  @IsOptional()
  sort?: RecipeSort;
}
