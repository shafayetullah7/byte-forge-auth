import { eq, and, count, inArray, sum } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  cartsTable,
  cartItemsTable,
  inventoryTable,
  TCart,
  TCartItem,
  TNewCart,
  TNewCartItem,
  TInventory,
} from '@/_db/drizzle/schema';
import { Injectable } from '@nestjs/common';
import type { TLockTransaction } from '@/libs/db/types';

@Injectable()
export class CartRepository {
  constructor(private readonly db: DrizzleService) {}

  async getCartByUserId(
    userId: string,
    transaction?: TLockTransaction,
  ): Promise<TCart | undefined> {
    const executor = this.db.getExecutor(transaction?.tx);
    const baseQuery = executor
      .select()
      .from(cartsTable)
      .where(eq(cartsTable.userId, userId));

    const lockQuery = transaction?.lock ? baseQuery.for('update') : baseQuery;
    const [cart] = await lockQuery.execute();
    return cart;
  }

  async getCartById(
    cartId: string,
    transaction?: TLockTransaction,
  ): Promise<TCart | undefined> {
    const executor = this.db.getExecutor(transaction?.tx);
    const baseQuery = executor
      .select()
      .from(cartsTable)
      .where(eq(cartsTable.id, cartId));

    const lockQuery = transaction?.lock ? baseQuery.for('update') : baseQuery;
    const [cart] = await lockQuery.execute();
    return cart;
  }

  async getCartByGuestToken(
    guestToken: string,
    transaction?: TLockTransaction,
  ): Promise<TCart | undefined> {
    const executor = this.db.getExecutor(transaction?.tx);
    const baseQuery = executor
      .select()
      .from(cartsTable)
      .where(eq(cartsTable.guestToken, guestToken));
    const lockQuery = transaction?.lock ? baseQuery.for('update') : baseQuery;
    const [cart] = await lockQuery.execute();
    return cart;
  }

  async getCartWithItems(userId: string) {
    return await this.db.client.query.cartsTable.findFirst({
      where: eq(cartsTable.userId, userId),
      with: {
        items: {
          with: {
            variant: {
              columns: {
                sku: true,
                price: true,
                isActive: true,
              },
              with: {
                product: {
                  columns: {
                    id: true,
                    slug: true,
                    productType: true,
                    status: true,
                    shopId: true,
                    thumbnailId: true,
                  },
                  with: {
                    thumbnail: {
                      columns: { id: true, url: true },
                    },
                    translations: {
                      columns: {
                        locale: true,
                        name: true,
                        shortDescription: true,
                      },
                    },
                  },
                },
                plantAttributes: {
                  columns: {
                    growthStage: true,
                    plantForm: true,
                    variegation: true,
                    leafDensity: true,
                    containerType: true,
                    containerSize: true,
                  },
                },
                translations: {
                  columns: {
                    locale: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async createCart(
    payload: TNewCart,
    transaction?: TLockTransaction,
  ): Promise<TCart> {
    const executor = this.db.getExecutor(transaction?.tx);
    const [cart] = await executor
      .insert(cartsTable)
      .values(payload)
      .returning()
      .execute();
    return cart;
  }

  async getCartItem(
    cartId: string,
    variantId: string,
    transaction?: TLockTransaction,
  ): Promise<TCartItem | undefined> {
    const executor = this.db.getExecutor(transaction?.tx);
    const baseQuery = executor
      .select()
      .from(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.cartId, cartId),
          eq(cartItemsTable.variantId, variantId),
        ),
      );

    const lockQuery = transaction?.lock ? baseQuery.for('update') : baseQuery;
    const [item] = await lockQuery.execute();
    return item;
  }

  async getCartItemById(
    cartItemId: string,
    transaction?: TLockTransaction,
  ): Promise<TCartItem | undefined> {
    const executor = this.db.getExecutor(transaction?.tx);
    const baseQuery = executor
      .select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItemId));

    const lockQuery = transaction?.lock ? baseQuery.for('update') : baseQuery;
    const [item] = await lockQuery.execute();
    return item;
  }

  async getCartItemsByCartId(
    cartId: string,
    transaction?: TLockTransaction,
  ): Promise<TCartItem[]> {
    const executor = this.db.getExecutor(transaction?.tx);
    return await executor
      .select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.cartId, cartId))
      .execute();
  }

  async getCartItemsCount(cartId: string): Promise<number> {
    const [{ total }] = await this.db.client
      .select({ total: count() })
      .from(cartItemsTable)
      .where(eq(cartItemsTable.cartId, cartId))
      .execute();
    return Number(total);
  }

  async getCartTotalQuantity(cartId: string): Promise<number> {
    const result = await this.db.client
      .select({ total: sum(cartItemsTable.quantity) })
      .from(cartItemsTable)
      .where(eq(cartItemsTable.cartId, cartId))
      .execute();
    return Number(result[0]?.total ?? 0);
  }

  async createCartItem(
    payload: TNewCartItem,
    transaction?: TLockTransaction,
  ): Promise<TCartItem> {
    const executor = this.db.getExecutor(transaction?.tx);
    const [item] = await executor
      .insert(cartItemsTable)
      .values(payload)
      .returning()
      .execute();
    return item;
  }

  async updateCartItem(
    cartItemId: string,
    data: Partial<Pick<TNewCartItem, 'quantity'>>,
    transaction?: TLockTransaction,
  ): Promise<TCartItem> {
    const executor = this.db.getExecutor(transaction?.tx);
    const [item] = await executor
      .update(cartItemsTable)
      .set(data)
      .where(eq(cartItemsTable.id, cartItemId))
      .returning()
      .execute();
    return item;
  }

  async deleteCartItem(
    cartItemId: string,
    transaction?: TLockTransaction,
  ): Promise<void> {
    const executor = this.db.getExecutor(transaction?.tx);
    await executor
      .delete(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItemId))
      .execute();
  }

  async deleteAllCartItems(
    cartId: string,
    transaction?: TLockTransaction,
  ): Promise<void> {
    const executor = this.db.getExecutor(transaction?.tx);
    await executor
      .delete(cartItemsTable)
      .where(eq(cartItemsTable.cartId, cartId))
      .execute();
  }

  async deleteCartItemsByIds(
    itemIds: string[],
    transaction?: TLockTransaction,
  ): Promise<void> {
    if (itemIds.length === 0) return;
    const executor = this.db.getExecutor(transaction?.tx);
    await executor
      .delete(cartItemsTable)
      .where(inArray(cartItemsTable.id, itemIds))
      .execute();
  }

  async getInventoryByVariantIds(variantIds: string[]): Promise<TInventory[]> {
    if (variantIds.length === 0) return [];
    return await this.db.client
      .select()
      .from(inventoryTable)
      .where(inArray(inventoryTable.variantId, variantIds))
      .execute();
  }

  async getInventoryByVariantId(
    variantId: string,
  ): Promise<TInventory | undefined> {
    const [inventory] = await this.db.client
      .select()
      .from(inventoryTable)
      .where(eq(inventoryTable.variantId, variantId))
      .execute();
    return inventory;
  }

  async getInventoryByVariantIdLocked(
    variantId: string,
    transaction?: TLockTransaction,
  ): Promise<TInventory | undefined> {
    const executor = this.db.getExecutor(transaction?.tx);
    const baseQuery = executor
      .select()
      .from(inventoryTable)
      .where(eq(inventoryTable.variantId, variantId));

    const lockQuery = transaction?.lock ? baseQuery.for('update') : baseQuery;
    const [inventory] = await lockQuery.execute();
    return inventory;
  }

  async deleteCart(
    cartId: string,
    transaction?: TLockTransaction,
  ): Promise<void> {
    const executor = this.db.getExecutor(transaction?.tx);
    await executor
      .delete(cartsTable)
      .where(eq(cartsTable.id, cartId))
      .execute();
  }

  async updateCart(
    cartId: string,
    data: Partial<Pick<TNewCart, 'userId' | 'guestToken'>>,
    transaction?: TLockTransaction,
  ): Promise<TCart> {
    const executor = this.db.getExecutor(transaction?.tx);
    const [cart] = await executor
      .update(cartsTable)
      .set(data)
      .where(eq(cartsTable.id, cartId))
      .returning()
      .execute();
    return cart;
  }

  async getCartWithItemsByGuestToken(guestToken: string) {
    return await this.db.client.query.cartsTable.findFirst({
      where: eq(cartsTable.guestToken, guestToken),
      with: {
        items: {
          with: {
            variant: {
              columns: {
                sku: true,
                price: true,
                isActive: true,
              },
              with: {
                product: {
                  columns: {
                    id: true,
                    slug: true,
                    productType: true,
                    status: true,
                    shopId: true,
                    thumbnailId: true,
                  },
                  with: {
                    thumbnail: {
                      columns: { id: true, url: true },
                    },
                    translations: {
                      columns: {
                        locale: true,
                        name: true,
                        shortDescription: true,
                      },
                    },
                  },
                },
                plantAttributes: {
                  columns: {
                    growthStage: true,
                    plantForm: true,
                    variegation: true,
                    leafDensity: true,
                    containerType: true,
                    containerSize: true,
                  },
                },
                translations: {
                  columns: {
                    locale: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getCartWithItemsById(cartId: string) {
    return await this.db.client.query.cartsTable.findFirst({
      where: eq(cartsTable.id, cartId),
      with: {
        items: {
          with: {
            variant: {
              columns: {
                sku: true,
                price: true,
                isActive: true,
              },
              with: {
                product: {
                  columns: {
                    id: true,
                    slug: true,
                    productType: true,
                    status: true,
                    shopId: true,
                    thumbnailId: true,
                  },
                  with: {
                    thumbnail: {
                      columns: { id: true, url: true },
                    },
                    translations: {
                      columns: {
                        locale: true,
                        name: true,
                        shortDescription: true,
                      },
                    },
                  },
                },
                plantAttributes: {
                  columns: {
                    growthStage: true,
                    plantForm: true,
                    variegation: true,
                    leafDensity: true,
                    containerType: true,
                    containerSize: true,
                  },
                },
                translations: {
                  columns: {
                    locale: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getCartWithItemsAndShopById(cartId: string) {
    return await this.db.client.query.cartsTable.findFirst({
      where: eq(cartsTable.id, cartId),
      with: {
        items: {
          with: {
            variant: {
              columns: {
                sku: true,
                price: true,
                isActive: true,
              },
              with: {
                product: {
                  columns: {
                    id: true,
                    slug: true,
                    productType: true,
                    status: true,
                    shopId: true,
                    thumbnailId: true,
                  },
                  with: {
                    thumbnail: {
                      columns: { id: true, url: true },
                    },
                    translations: {
                      columns: {
                        locale: true,
                        name: true,
                        shortDescription: true,
                      },
                    },
                    shop: {
                      columns: {
                        id: true,
                      },
                      with: {
                        translations: {
                          columns: {
                            locale: true,
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
                plantAttributes: {
                  columns: {
                    growthStage: true,
                    plantForm: true,
                    variegation: true,
                    leafDensity: true,
                    containerType: true,
                    containerSize: true,
                  },
                },
                translations: {
                  columns: {
                    locale: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
