import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@generated/prisma/client';

import { Auth } from '../auth/decorators';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // @Auth() must sit on the handler: RolProtected/UserRoleGuard resolve role
  // metadata via context.getHandler(), so a class-level role decorator is ignored.
  @Get('overview')
  @Auth(Role.admin)
  @ApiOperation({ summary: 'Admin-only overview of all users and their recipe counts' })
  @ApiResponse({ status: 200, description: 'Ok' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (non-admin)' })
  getOverview() {
    return this.adminService.getOverview();
  }
}
