import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [AuthModule, PrismaModule],
})
export class AdminModule {}
