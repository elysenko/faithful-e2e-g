import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

// Sort orders supported by the My Recipes list (and by saved views).
export const RECIPE_SORTS = ['newest', 'title'] as const;
export type RecipeSort = (typeof RECIPE_SORTS)[number];

export class QueryRecipesDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive search text matched against the recipe title',
    type: 'string',
    example: 'banitsa',
  })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({
    description: 'Sort order: `newest` (createdAt desc, default) or `title` (title asc)',
    enum: RECIPE_SORTS,
    example: 'newest',
  })
  @IsIn(RECIPE_SORTS)
  @IsOptional()
  sort?: RecipeSort;
}
