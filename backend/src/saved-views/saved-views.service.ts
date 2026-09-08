import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSavedViewDto } from './dto/create-saved-view.dto';

@Injectable()
export class SavedViewsService {
  private readonly logger = new Logger('SavedViewsService');

  constructor(private prisma: PrismaService) {}

  // List the current user's saved views, oldest first so the order stays stable
  // as new views are appended.
  async findAll(userId: string) {
    try {
      return await this.prisma.savedView.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      this.logger.error(`GET: saved-views: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  // Fetch a single saved view scoped to its owner. Cross-user access returns 404.
  async findOne(userId: string, id: string) {
    const savedView = await this.prisma.savedView.findFirst({
      where: { id, userId },
    });

    if (!savedView) throw new NotFoundException('Saved view not found');

    return savedView;
  }

  // Create a saved view for the current user. Names are unique per user, so
  // re-saving under an existing name overwrites that view's search/sort.
  async create(userId: string, dto: CreateSavedViewDto) {
    const data = {
      name: dto.name.trim(),
      search: dto.search ?? '',
      sort: dto.sort ?? 'newest',
    };

    try {
      return await this.prisma.savedView.upsert({
        where: { userId_name: { userId, name: data.name } },
        update: { search: data.search, sort: data.sort },
        create: { ...data, userId },
      });
    } catch (error) {
      this.logger.error(`POST: saved-views: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async remove(userId: string, id: string) {
    // Ensure ownership before deleting (throws 404 if not owned).
    await this.findOne(userId, id);

    try {
      await this.prisma.savedView.delete({ where: { id } });
      return { message: 'Saved view deleted' };
    } catch (error) {
      this.logger.error(`DELETE: saved-views/${id}: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }
}
