import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { wishlistItemsTable, wishlistsTable } from '@/_db/drizzle/schema/cart';
import { productVariantsTable } from '@/_db/drizzle/schema';
import { ProductStatusEnum } from '@/_db/drizzle/enum';

@Injectable()
export class WishlistRepository {
  constructor(private readonly db: DrizzleService) {}

  async getOrCreateWishlist(userId: string) {
    const existing = await this.db.client.query.wishlistsTable.findFirst({
      where: eq(wishlistsTable.userId, userId),
    });
    if (existing) return existing;

    const [created] = await this.db.client
      .insert(wishlistsTable)
      .values({ userId })
      .onConflictDoNothing()
      .returning();

    if (created) return created;

    return this.db.client.query.wishlistsTable.findFirst({
      where: eq(wishlistsTable.userId, userId),
    });
  }

  async listItems(userId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    if (!wishlist) return [];

    return this.db.client.query.wishlistItemsTable.findMany({
      where: eq(wishlistItemsTable.wishlistId, wishlist.id),
      orderBy: desc(wishlistItemsTable.createdAt),
      with: {
        variant: {
          with: {
            product: {
              with: {
                translations: true,
                thumbnail: true,
                shop: { with: { translations: true } },
              },
            },
          },
        },
      },
    });
  }

  async addItem(userId: string, variantId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    if (!wishlist) throw new ConflictException('Wishlist unavailable');

    const variantRow =
      await this.db.client.query.productVariantsTable.findFirst({
        where: eq(productVariantsTable.id, variantId),
        with: { product: true },
      });

    if (!variantRow) {
      throw new NotFoundException('Variant not found');
    }

    if (variantRow.product.status === ProductStatusEnum.ARCHIVED) {
      throw new ConflictException('Product is not available');
    }

    const [item] = await this.db.client
      .insert(wishlistItemsTable)
      .values({ wishlistId: wishlist.id, variantId })
      .onConflictDoNothing()
      .returning();

    if (!item) {
      return this.db.client.query.wishlistItemsTable.findFirst({
        where: and(
          eq(wishlistItemsTable.wishlistId, wishlist.id),
          eq(wishlistItemsTable.variantId, variantId),
        ),
      });
    }

    return item;
  }

  async removeItem(userId: string, variantId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    if (!wishlist) return [];

    return this.db.client
      .delete(wishlistItemsTable)
      .where(
        and(
          eq(wishlistItemsTable.wishlistId, wishlist.id),
          eq(wishlistItemsTable.variantId, variantId),
        ),
      )
      .returning();
  }

  async hasItem(userId: string, variantId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    if (!wishlist) return false;

    const row = await this.db.client.query.wishlistItemsTable.findFirst({
      where: and(
        eq(wishlistItemsTable.wishlistId, wishlist.id),
        eq(wishlistItemsTable.variantId, variantId),
      ),
      columns: { id: true },
    });
    return Boolean(row);
  }
}
