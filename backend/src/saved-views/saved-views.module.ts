import { Module } from '@nestjs/common';
import { SavedViewsController } from './saved-views.controller';
import { SavedViewsService } from './saved-views.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [SavedViewsController],
  providers: [SavedViewsService],
  imports: [AuthModule, PrismaModule],
})
export class SavedViewsModule {}
