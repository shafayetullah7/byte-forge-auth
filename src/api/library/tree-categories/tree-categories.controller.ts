import { Controller } from '@nestjs/common';
import { TreeCategoriesService } from './tree-categories.service';

@Controller('tree-categories')
export class TreeCategoriesController {
  constructor(private readonly treeCategoriesService: TreeCategoriesService) {}
}
