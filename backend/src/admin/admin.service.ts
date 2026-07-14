import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface AdminOverviewRow {
  userId: string;
  email: string;
  recipeCount: number;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger('AdminService');

  constructor(private prisma: PrismaService) {}

  // One row per user with their recipe count, for the admin overview table.
  async getOverview(): Promise<AdminOverviewRow[]> {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          _count: { select: { recipes: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      return users.map((u) => ({
        userId: u.id,
        email: u.email,
        recipeCount: u._count.recipes,
      }));
    } catch (error) {
      this.logger.error(`GET: admin/overview: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }
}
