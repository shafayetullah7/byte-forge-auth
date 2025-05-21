import { Inject, Injectable } from '@nestjs/common';
import { DrizzleClient } from './types';
import { DRIZZLE } from './types/drizzle.token';

@Injectable()
export class DrizzleService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleClient,
  ) {}

  get client() {
    return this.db;
  }
}
