import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [RecipesController],
  providers: [RecipesService],
  imports: [AuthModule, PrismaModule],
})
export class RecipesModule {}
