import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';

@Injectable()
export class UserService {
  constructor(private readonly drizzle: DrizzleService) {}
}
