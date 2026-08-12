import { Controller } from '@nestjs/common';
import { AdminSessionService } from '../application/admin-session.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller({ path: 'admin/session', version: '1' })
export class AdminSessionController {
  constructor(private readonly adminSessionService: AdminSessionService) {}
}
