import { Injectable, NotFoundException } from '@nestjs/common';
import { isUuid } from '@/common/utils/is-uuid.util';
import { TagAdminRepository } from '../../repositories/tag-admin.repository';

@Injectable()
export class GetAdminTagByIdQuery {
  constructor(private readonly tagAdminRepository: TagAdminRepository) {}

  async execute(id: string) {
    const tag = await this.tagAdminRepository.findByIdOrSlug(id);
    if (!tag) {
      throw new NotFoundException(
        `Tag with ${isUuid(id) ? 'ID' : 'slug'} '${id}' not found`,
      );
    }
    return tag;
  }
}
