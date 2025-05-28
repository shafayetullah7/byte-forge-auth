import { Module } from '@nestjs/common';
import { TreeCategoriesService } from './tree-categories.service';
import { TreeCategoriesController } from './tree-categories.controller';

@Module({
  controllers: [TreeCategoriesController],
  providers: [TreeCategoriesService],
})
export class TreeCategoriesModule {}
