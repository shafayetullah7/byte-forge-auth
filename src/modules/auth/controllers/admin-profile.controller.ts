import { Controller } from '@nestjs/common';
import { AdminService } from '../application/admin.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller({ path: 'admin/profile', version: '1' })
export class AdminProfileController {
  constructor(private readonly adminService: AdminService) {}
}
