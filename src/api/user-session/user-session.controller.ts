import { Controller } from '@nestjs/common';
import { UserSessionService } from './user-session.service';

@Controller('user-session')
export class UserSessionController {
  constructor(private readonly userSessionService: UserSessionService) {}
}
