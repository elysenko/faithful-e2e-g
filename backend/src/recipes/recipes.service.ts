import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger('RecipesService');

  constructor(private prisma: PrismaService) {}

  // List the current user's recipes, newest first.
  async findAll(userId: string) {
    try {
      return await this.prisma.recipe.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`GET: recipes: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  // Fetch a single recipe scoped to its owner. Cross-user access returns 404.
  async findOne(userId: string, id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, userId },
    });

    if (!recipe) throw new NotFoundException('Recipe not found');

    return recipe;
  }

  async create(userId: string, dto: CreateRecipeDto) {
    try {
      return await this.prisma.recipe.create({
        data: { ...dto, userId },
      });
    } catch (error) {
      this.logger.error(`POST: recipes: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async update(userId: string, id: string, dto: UpdateRecipeDto) {
    // Ensure ownership before mutating (throws 404 if not owned).
    await this.findOne(userId, id);

    try {
      return await this.prisma.recipe.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      this.logger.error(`PATCH: recipes/${id}: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async remove(userId: string, id: string) {
    // Ensure ownership before deleting (throws 404 if not owned).
    await this.findOne(userId, id);

    try {
      await this.prisma.recipe.delete({ where: { id } });
      return { message: 'Recipe deleted' };
    } catch (error) {
      this.logger.error(`DELETE: recipes/${id}: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }
}
