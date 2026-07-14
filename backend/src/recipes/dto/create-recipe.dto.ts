import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateRecipeDto {
  @ApiProperty({
    description: 'Recipe title',
    nullable: false,
    required: true,
    type: 'string',
    example: 'Banitsa',
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: 'Ingredients (free text, one per line)',
    nullable: false,
    required: true,
    type: 'string',
    example: '500g filo pastry\n400g Bulgarian sirene\n4 eggs',
  })
  @IsString()
  @MinLength(1)
  ingredients: string;

  @ApiProperty({
    description: 'Preparation steps (free text)',
    nullable: false,
    required: true,
    type: 'string',
    example: '1. Whisk eggs and cheese.\n2. Layer filo and bake.',
  })
  @IsString()
  @MinLength(1)
  steps: string;
}
