import {
  eq,
  inArray,
  count,
  desc,
  and,
  or,
  like,
  sql,
  SQL,
  gte,
  lte,
  asc,
} from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  ordersTable,
  orderItemsTable,
  orderAddressTable,
  orderStatusHistoryTable,
  orderGroupsTable,
  TOrder,
  TNewOrder,
  TOrderItem,
  TNewOrderItem,
  TOrderAddress,
  TNewOrderAddress,
  TOrderStatusHistory,
  TNewOrderStatusHistory,
  TOrderGroup,
  TNewOrderGroup,
} from '@/_db/drizzle/schema/order';
import {
  shipmentsTable,
  TNewShipment,
  TShipment,
} from '@/_db/drizzle/schema/shipping';
import { districtsTable } from '@/_db/drizzle/schema/location/district.schema';
import { districtTranslationsTable } from '@/_db/drizzle/schema/location/district.translation.schema';
import { shopShippingRatesTable } from '@/_db/drizzle/schema/shop/shop.shipping-rates.schema';
import { TOrderStatus, TPaymentStatus } from '@/_db/drizzle/enum';
import { Injectable } from '@nestjs/common';
import type { TLockTransaction } from '@/libs/db/types';
import { Order } from '../domain/order.entity';
import { OrderGroup } from '../domain/order-group.entity';
import {
  mapOrderEntityToUpdatePatch,
  mapOrderGroupRowToEntity,
  mapOrderRowToEntity,
} from './order.repository.mapper';
import type {
  AdminOrderWithRelations,
  BuyerOrderStats,
  BuyerOrderWithRelations,
  BuyerOrderGroupWithDetails,
  GetAdminOrdersParams,
  GetBuyerOrderGroupsParams,
  GetSellerOrdersParams,
  SellerOrderStats,
  SellerOrderWithRelations,
} from './order.repository.types';

export type {
  AdminOrderWithRelations,
  BuyerOrderStats,
  BuyerOrderWithRelations,
  GetAdminOrdersParams,
  GetBuyerOrderGroupsParams,
  GetSellerOrdersParams,
  OrderPaymentMethodCatalog,
  SellerOrderStats,
  SellerOrderWithRelations,
} from './order.repository.types';

@Injectable()
export class OrderRepository {
  constructor(private readonly db: DrizzleService) {}

  async createOrder(
    data: TNewOrder,
    transaction?: TLockTransaction,
  ): Promise<Order> {
    const executor = this.db.getExecutor(transaction?.tx);
    const [order] = await executor
      .insert(ordersTable)
      .values(data)
      .returning()
      .execute();
    return mapOrderRowToEntity(order);
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await this.db.client
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .execute();
    return order ? mapOrderRowToEntity(order) : undefined;
  }

  async getOrderRowById(id: string): Promise<TOrder | undefined> {
    const [order] = await this.db.client
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .execute();
    return order;
  }

  async getOrderByIdAndUserId(
    id: string,
    userId: string,
    transaction?: TLockTransaction,
  ): Promise<Order | undefined> {
    const row = await this.getOrderRowByIdAndUserId(id, userId, transaction);
    return row ? mapOrderRowToEntity(row) : undefined;
  }

  async getOrderRowByIdAndUserId(
    id: string,
    userId: string,
    transaction?: TLockTransaction,
  ): Promise<TOrder | undefined> {
    const executor = this.db.getExecutor(transaction?.tx);
    const baseQuery = executor
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, id), eq(ordersTable.userId, userId)));

    const lockQuery = transaction?.lock ? baseQuery.for('update') : baseQuery;
    const [order] = await lockQuery.execute();
    return order;
  }

  async getOrderByIdAndShopId(
    id: string,
    shopId: string,
    transaction?: TLockTransaction,
  ): Promise<Order | undefined> {
    const row = await this.getOrderRowByIdAndShopId(id, shopId, transaction);
    return row ? mapOrderRowToEntity(row) : undefined;
  }

  async getOrderRowByIdAndShopId(
    id: string,
    shopId: string,
    transaction?: TLockTransaction,
  ): Promise<TOrder | undefined> {
    const executor = this.db.getExecutor(transaction?.tx);
    const baseQuery = executor
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, id), eq(ordersTable.shopId, shopId)));

    const lockQuery = transaction?.lock ? baseQuery.for('update') : baseQuery;
    const [order] = await lockQuery.execute();
    return order;
  }

  async getOrderItemsByOrderId(orderId: string): Promise<TOrderItem[]> {
    return await this.db.client
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId))
      .execute();
  }

  async createShipment(
    data: TNewShipment,
    transaction?: TLockTransaction,
  ): Promise<TShipment> {
    const executor = this.db.getExecutor(transaction?.tx);
    const [shipment] = await executor
      .insert(shipmentsTable)
      .values(data)
      .returning()
      .execute();
    return shipment;
  }

  async getShipmentByOrderId(orderId: string): Promise<TShipment | undefined> {
    const [shipment] = await this.db.client
      .select()
      .from(shipmentsTable)
      .where(eq(shipmentsTable.orderId, orderId))
      .execute();
    return shipment;
  }

  async updateShipment(
    orderId: string,
    data: Partial<TShipment>,
    transaction?: TLockTransaction,
  ): Promise<TShipment> {
    const executor = this.db.getExecutor(transaction?.tx);
    const [shipment] = await executor
      .update(shipmentsTable)
      .set(data)
      .where(eq(shipmentsTable.orderId, orderId))
      .returning()
      .execute();
    return shipment;
  }

  async updateOrder(
    id: string,
    data: Partial<TOrder>,
    transaction?: TLockTransaction,
  ): Promise<Order> {
    const executor = this.db.getExecutor(transaction?.tx);
    const [order] = await executor
      .update(ordersTable)
      .set(data)
      .where(eq(ordersTable.id, id))
      .returning()
      .execute();
    return mapOrderRowToEntity(order);
  }

  async save(order: Order, transaction?: TLockTransaction): Promise<Order> {
    return this.updateOrder(
      order.id,
      mapOrderEntityToUpdatePatch(order),
      transaction,
    );
  }

  async updateOrderGroup(
    id: string,
    data: Partial<TOrderGroup>,
    transaction?: TLockTransaction,
  ): Promise<OrderGroup> {
    const executor = this.db.getExecutor(transaction?.tx);
    const [group] = await executor
      .update(orderGroupsTable)
      .set(data)
      .where(eq(orderGroupsTable.id, id))
      .returning()
      .execute();
    return mapOrderGroupRowToEntity(group);
  }

  async getOrdersByGroupId(groupId: string): Promise<TOrder[]> {
    return await this.db.client
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.groupId, groupId))
      .orderBy(ordersTable.createdAt)
      .execute();
  }

  async createOrderItem(
    data: TNewOrderItem,
    transaction?: TLockTransaction,
  ): Promise<TOrderItem> {
    const executor = this.db.getExecutor(transaction?.tx);
    const [item] = await executor
      .insert(orderItemsTable)
      .values(data)
      .returning()
      .execute();
    return item;
  }

  async createOrderItems(
    items: TNewOrderItem[],
    transaction?: TLockTransaction,
  ): Promise<TOrderItem[]> {
    const executor = this.db.getExecutor(transaction?.tx);
    const result = await executor
      .insert(orderItemsTable)
      .values(items)
      .returning()
      .execute();
    return result;
  }

  async createOrderAddress(
    data: TNewOrderAddress,
    transaction?: TLockTransaction,
  ): Promise<TOrderAddress> {
    const executor = this.db.getExecutor(transaction?.tx);
    const [address] = await executor
      .insert(orderAddressTable)
      .values(data)
      .returning()
      .execute();
    return address;
  }

  async createOrderStatusHistory(
    data: TNewOrderStatusHistory,
    transaction?: TLockTransaction,
  ): Promise<TOrderStatusHistory> {
    const executor = this.db.getExecutor(transaction?.tx);
    const [history] = await executor
      .insert(orderStatusHistoryTable)
      .values(data)
      .returning()
      .execute();
    return history;
  }

  async createOrderGroup(
    data: TNewOrderGroup,
    transaction?: TLockTransaction,
  ): Promise<OrderGroup> {
    const executor = this.db.getExecutor(transaction?.tx);
    const [group] = await executor
      .insert(orderGroupsTable)
      .values(data)
      .returning()
      .execute();
    return mapOrderGroupRowToEntity(group);
  }

  async nextOrderNumber(transaction?: TLockTransaction): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `BF-${year}-${month}-`;

    const executor = this.db.getExecutor(transaction?.tx);
    const lastOrder = await executor
      .select({ orderNumber: ordersTable.orderNumber })
      .from(ordersTable)
      .where(like(ordersTable.orderNumber, `${prefix}%`))
      .orderBy(desc(ordersTable.orderNumber))
      .limit(1)
      .execute();

    const counter =
      lastOrder.length > 0
        ? parseInt(lastOrder[0].orderNumber.split('-').pop() ?? '0', 10) + 1
        : 1;

    return `${prefix}${String(counter).padStart(4, '0')}`;
  }

  async getShopShippingRatesForDistrict(
    shopIds: string[],
    districtId: string,
  ): Promise<Array<{ shopId: string; cost: string }>> {
    if (shopIds.length === 0) {
      return [];
    }

    return this.db.client.query.shopShippingRatesTable.findMany({
      where: and(
        inArray(shopShippingRatesTable.shopId, shopIds),
        eq(shopShippingRatesTable.districtId, districtId),
      ),
      columns: {
        shopId: true,
        cost: true,
      },
    });
  }

  async getDistrictTranslatedName(
    districtId: string,
    lang: string,
  ): Promise<string> {
    const [row] = await this.db.client
      .select({
        districtName: districtTranslationsTable.name,
      })
      .from(districtsTable)
      .leftJoin(
        districtTranslationsTable,
        eq(districtsTable.id, districtTranslationsTable.districtId),
      )
      .where(
        and(
          eq(districtsTable.id, districtId),
          eq(districtTranslationsTable.locale, lang),
        ),
      )
      .execute();

    return row?.districtName ?? '';
  }

  async getOrderGroupWithOrders(
    groupId: string,
  ): Promise<(TOrderGroup & { orders: TOrder[] }) | undefined> {
    const [group] = await this.db.client.query.orderGroupsTable.findMany({
      where: eq(orderGroupsTable.id, groupId),
      with: {
        orders: true,
      },
    });
    return group;
  }

  async getOrdersWithItemsByGroupId(groupId: string): Promise<TOrder[]> {
    const orders = await this.db.client.query.ordersTable.findMany({
      where: eq(ordersTable.groupId, groupId),
      with: {
        items: true,
        address: true,
        statusHistory: {
          orderBy: orderStatusHistoryTable.createdAt,
        },
      },
    });
    return orders;
  }

  async getBuyerOrderStats(userId: string): Promise<BuyerOrderStats> {
    const allGroups = await this.db.client.query.orderGroupsTable.findMany({
      where: eq(orderGroupsTable.userId, userId),
      with: {
        orders: true,
      },
    });

    const activeStatuses = [
      'PENDING_PAYMENT',
      'PROCESSING',
      'CONFIRMED',
      'SHIPPED',
      'DELIVERED',
    ];

    return {
      total: allGroups.length,
      active: allGroups.filter((g) =>
        g.orders.some((o) => activeStatuses.includes(o.status)),
      ).length,
      delivered: allGroups.filter((g) =>
        g.orders.some(
          (o) => o.status === 'DELIVERED' || o.status === 'COMPLETED',
        ),
      ).length,
      cancelled: allGroups.filter((g) =>
        g.orders.some((o) => o.status === 'CANCELLED'),
      ).length,
      totalSpent: allGroups
        .filter((g) => g.orders.some((o) => o.status === 'COMPLETED'))
        .reduce((sum, g) => sum + parseFloat(g.totalAmount), 0)
        .toFixed(0),
    };
  }

  async getBuyerOrderGroupsPaginated(
    params: GetBuyerOrderGroupsParams,
  ): Promise<{
    groups: (TOrderGroup & {
      orders: BuyerOrderWithRelations[];
    })[];
    total: number;
  }> {
    const {
      userId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      orderStatus,
      paymentStatus,
      search,
      lang = 'en',
    } = params;

    const offset = (page - 1) * limit;

    // Build base where for user
    const userWhere = eq(orderGroupsTable.userId, userId);

    // If filtering by order status or payment status, we need to find groupIds that match
    let filteredGroupIds: string[] | undefined;

    if (orderStatus || paymentStatus || search) {
      const orderConditions: SQL[] = [eq(ordersTable.userId, userId)];

      if (orderStatus) {
        orderConditions.push(eq(ordersTable.status, orderStatus));
      }

      if (paymentStatus) {
        orderConditions.push(eq(ordersTable.paymentStatus, paymentStatus));
      }

      if (search) {
        const searchLower = `%${search.toLowerCase()}%`;
        orderConditions.push(
          or(
            like(ordersTable.orderNumber, searchLower),
            sql`EXISTS (
              SELECT 1 FROM shop_translations st
              JOIN shops s ON st.shop_id = s.id
              WHERE s.id = ${ordersTable.shopId}
              AND st.locale = ${lang}
              AND LOWER(st.name) LIKE ${searchLower}
            )`,
            sql`EXISTS (
              SELECT 1 FROM ${orderItemsTable} oi
              WHERE oi.order_id = ${ordersTable.id}
              AND LOWER(oi.product_name) LIKE ${searchLower}
            )`,
          )!,
        );
      }

      const matchingOrders = await this.db.client
        .select({ groupId: ordersTable.groupId })
        .from(ordersTable)
        .where(and(...orderConditions))
        .execute();

      filteredGroupIds = matchingOrders
        .map((o) => o.groupId)
        .filter((id): id is string => id !== null);

      if (filteredGroupIds.length === 0) {
        return { groups: [], total: 0 };
      }
    }

    // Build group where
    const groupWhere = filteredGroupIds
      ? and(userWhere, inArray(orderGroupsTable.id, filteredGroupIds))
      : userWhere;

    // Count total matching groups
    const totalResult = await this.db.client
      .select({ count: count() })
      .from(orderGroupsTable)
      .where(groupWhere)
      .execute();

    // Order by
    const orderByField =
      sortBy === 'createdAt'
        ? orderGroupsTable.createdAt
        : orderGroupsTable.totalAmount;

    // Fetch groups with orders
    const groups = await this.db.client.query.orderGroupsTable.findMany({
      where: groupWhere,
      with: {
        orders: {
          with: {
            items: true,
            address: true,
            statusHistory: {
              orderBy: orderStatusHistoryTable.createdAt,
            },
            shop: {
              with: {
                translations: {
                  where: (t) => eq(t.locale, lang),
                },
                logo: true,
              },
            },
            paymentMethodCatalog: {
              with: {
                logo: true,
              },
            },
          },
        },
      },
      ...(sortOrder === 'desc' ? { orderBy: desc(orderByField) } : {}),
      limit,
      offset,
    });

    return {
      groups,
      total: totalResult[0]?.count ?? 0,
    };
  }

  async getSellerOrderStats(shopId: string): Promise<SellerOrderStats> {
    const orders = await this.db.client
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.shopId, shopId))
      .execute();

    const pendingStatuses = ['PENDING_PAYMENT'];
    const processingStatuses = ['PROCESSING', 'CONFIRMED'];

    return {
      total: orders.length,
      pending: orders.filter((o) => pendingStatuses.includes(o.status)).length,
      processing: orders.filter((o) => processingStatuses.includes(o.status))
        .length,
      shipped: orders.filter((o) => o.status === 'SHIPPED').length,
      delivered: orders.filter(
        (o) => o.status === 'DELIVERED' || o.status === 'COMPLETED',
      ).length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
      revenue: orders
        .filter((o) => o.status === 'COMPLETED')
        .reduce((sum, o) => sum + parseFloat(o.total), 0)
        .toFixed(2),
    };
  }

  async getSellerOrdersPaginated(params: GetSellerOrdersParams): Promise<{
    orders: SellerOrderWithRelations[];
    total: number;
  }> {
    const {
      shopId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      orderStatus,
      paymentStatus,
      search,
      dateFrom,
      dateTo,
    } = params;

    const offset = (page - 1) * limit;
    const conditions: SQL[] = [eq(ordersTable.shopId, shopId)];

    if (orderStatus) {
      conditions.push(eq(ordersTable.status, orderStatus));
    }

    if (paymentStatus) {
      conditions.push(eq(ordersTable.paymentStatus, paymentStatus));
    }

    if (dateFrom) {
      conditions.push(gte(ordersTable.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(
        lte(ordersTable.createdAt, new Date(`${dateTo}T23:59:59.999Z`)),
      );
    }

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          like(ordersTable.orderNumber, searchLower),
          sql`EXISTS (
            SELECT 1 FROM ${orderItemsTable} oi
            WHERE oi.order_id = ${ordersTable.id}
            AND LOWER(oi.product_name) LIKE ${searchLower}
          )`,
          sql`EXISTS (
            SELECT 1 FROM ${orderAddressTable} oa
            WHERE oa.order_id = ${ordersTable.id}
            AND (
              LOWER(oa.recipient_name) LIKE ${searchLower}
              OR LOWER(oa.phone) LIKE ${searchLower}
            )
          )`,
        )!,
      );
    }

    const whereClause = and(...conditions);

    const totalResult = await this.db.client
      .select({ count: count() })
      .from(ordersTable)
      .where(whereClause)
      .execute();

    const orderByField =
      sortBy === 'total' ? ordersTable.total : ordersTable.createdAt;

    const orders = await this.db.client.query.ordersTable.findMany({
      where: whereClause,
      with: {
        items: true,
        address: true,
        statusHistory: {
          orderBy: orderStatusHistoryTable.createdAt,
          with: {
            changedByUser: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        shipment: true,
        paymentMethodCatalog: {
          with: {
            logo: true,
          },
        },
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            email: true,
          },
        },
      },
      ...(sortOrder === 'desc'
        ? { orderBy: desc(orderByField) }
        : { orderBy: asc(orderByField) }),
      limit,
      offset,
    });

    return {
      orders,
      total: totalResult[0]?.count ?? 0,
    };
  }

  async getSellerOrderDetail(
    orderId: string,
    shopId: string,
  ): Promise<SellerOrderWithRelations | null> {
    const [order] = await this.db.client.query.ordersTable.findMany({
      where: and(eq(ordersTable.id, orderId), eq(ordersTable.shopId, shopId)),
      with: {
        items: true,
        address: true,
        statusHistory: {
          orderBy: orderStatusHistoryTable.createdAt,
          with: {
            changedByUser: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        shipment: true,
        paymentMethodCatalog: {
          with: {
            logo: true,
          },
        },
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            email: true,
          },
        },
      },
      limit: 1,
    });

    return order ?? null;
  }

  private buildAdminOrderConditions(params: {
    shopId?: string;
    userId?: string;
    orderStatus?: TOrderStatus;
    paymentStatus?: TPaymentStatus;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): SQL[] {
    const conditions: SQL[] = [];

    if (params.shopId) {
      conditions.push(eq(ordersTable.shopId, params.shopId));
    }

    if (params.userId) {
      conditions.push(eq(ordersTable.userId, params.userId));
    }

    if (params.orderStatus) {
      conditions.push(eq(ordersTable.status, params.orderStatus));
    }

    if (params.paymentStatus) {
      conditions.push(eq(ordersTable.paymentStatus, params.paymentStatus));
    }

    if (params.dateFrom) {
      conditions.push(gte(ordersTable.createdAt, new Date(params.dateFrom)));
    }

    if (params.dateTo) {
      conditions.push(
        lte(ordersTable.createdAt, new Date(`${params.dateTo}T23:59:59.999Z`)),
      );
    }

    if (params.search) {
      const searchLower = `%${params.search.toLowerCase()}%`;
      conditions.push(
        or(
          like(ordersTable.orderNumber, searchLower),
          sql`EXISTS (
            SELECT 1 FROM ${orderItemsTable} oi
            WHERE oi.order_id = ${ordersTable.id}
            AND LOWER(oi.product_name) LIKE ${searchLower}
          )`,
          sql`EXISTS (
            SELECT 1 FROM ${orderAddressTable} oa
            WHERE oa.order_id = ${ordersTable.id}
            AND (
              LOWER(oa.recipient_name) LIKE ${searchLower}
              OR LOWER(oa.phone) LIKE ${searchLower}
            )
          )`,
        )!,
      );
    }

    return conditions;
  }

  async getAdminOrderStats(filters?: {
    shopId?: string;
    userId?: string;
  }): Promise<SellerOrderStats> {
    const conditions = this.buildAdminOrderConditions(filters ?? {});
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orders = await this.db.client
      .select()
      .from(ordersTable)
      .where(whereClause)
      .execute();

    const pendingStatuses = ['PENDING_PAYMENT'];
    const processingStatuses = ['PROCESSING', 'CONFIRMED'];

    return {
      total: orders.length,
      pending: orders.filter((o) => pendingStatuses.includes(o.status)).length,
      processing: orders.filter((o) => processingStatuses.includes(o.status))
        .length,
      shipped: orders.filter((o) => o.status === 'SHIPPED').length,
      delivered: orders.filter(
        (o) => o.status === 'DELIVERED' || o.status === 'COMPLETED',
      ).length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
      revenue: orders
        .filter((o) => o.status === 'COMPLETED')
        .reduce((sum, o) => sum + parseFloat(o.total), 0)
        .toFixed(2),
    };
  }

  async getAdminOrdersPaginated(params: GetAdminOrdersParams): Promise<{
    orders: AdminOrderWithRelations[];
    total: number;
  }> {
    const {
      shopId,
      userId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      orderStatus,
      paymentStatus,
      search,
      dateFrom,
      dateTo,
      lang = 'en',
    } = params;

    const offset = (page - 1) * limit;
    const conditions = this.buildAdminOrderConditions({
      shopId,
      userId,
      orderStatus,
      paymentStatus,
      search,
      dateFrom,
      dateTo,
    });

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db.client
      .select({ count: count() })
      .from(ordersTable)
      .where(whereClause)
      .execute();

    const orderByField =
      sortBy === 'total' ? ordersTable.total : ordersTable.createdAt;

    const orders = await this.db.client.query.ordersTable.findMany({
      where: whereClause,
      with: {
        items: true,
        address: true,
        statusHistory: {
          orderBy: orderStatusHistoryTable.createdAt,
          with: {
            changedByUser: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        shipment: true,
        paymentMethodCatalog: {
          with: {
            logo: true,
          },
        },
        shop: {
          with: {
            translations: {
              where: (t) => eq(t.locale, lang),
            },
          },
        },
      },
      ...(sortOrder === 'desc'
        ? { orderBy: desc(orderByField) }
        : { orderBy: asc(orderByField) }),
      limit,
      offset,
    });

    return {
      orders: orders,
      total: totalResult[0]?.count ?? 0,
    };
  }

  async getAdminOrderDetail(
    orderId: string,
    lang: string = 'en',
  ): Promise<AdminOrderWithRelations | null> {
    const [order] = await this.db.client.query.ordersTable.findMany({
      where: eq(ordersTable.id, orderId),
      with: {
        items: true,
        address: true,
        statusHistory: {
          orderBy: orderStatusHistoryTable.createdAt,
          with: {
            changedByUser: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        shipment: true,
        paymentMethodCatalog: {
          with: {
            logo: true,
          },
        },
        shop: {
          with: {
            translations: {
              where: (t) => eq(t.locale, lang),
            },
          },
        },
      },
      limit: 1,
    });

    return order ?? null;
  }

  async getBuyerOrderGroupWithDetails(
    groupId: string,
    userId: string,
    lang: string = 'en',
  ): Promise<BuyerOrderGroupWithDetails | null> {
    const [group] = await this.db.client.query.orderGroupsTable.findMany({
      where: and(
        eq(orderGroupsTable.id, groupId),
        eq(orderGroupsTable.userId, userId),
      ),
      with: {
        orders: {
          with: {
            items: true,
            address: true,
            statusHistory: {
              orderBy: orderStatusHistoryTable.createdAt,
              with: {
                changedByUser: true,
              },
            },
            shop: {
              with: {
                translations: {
                  where: (t) => eq(t.locale, lang),
                },
                logo: true,
              },
            },
            paymentMethodCatalog: {
              with: {
                logo: true,
              },
            },
            shipment: true,
          },
        },
      },
    });

    return group ?? null;
  }
}
