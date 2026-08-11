# Order module

Buyer checkout, buyer/seller/admin order reads, and order lifecycle commands.

## Public exports (`OrderModule`)

| Export | Kind | Purpose |
|--------|------|---------|
| `PlaceOrderCommand` | Command | Checkout: create order group + orders, reserve inventory, clear cart |
| `CancelBuyerOrderCommand` | Command | Buyer cancel |
| `ConfirmDeliveryCommand` | Command | Buyer confirm delivery |
| `CancelSellerOrderCommand` | Command | Seller cancel + inventory release |
| `ShipSellerOrderCommand` | Command | Seller ship + inventory fulfill |
| `UpdateSellerOrderStatusCommand` | Command | Seller status transitions |
| `GetBuyerOrdersQuery` | Query | Paginated buyer orders |
| `GetBuyerOrderStatsQuery` | Query | Buyer order stats |
| `GetOrderGroupQuery` | Query | Buyer order group detail |
| `ListSellerOrdersQuery` | Query | Paginated seller orders |
| `GetSellerOrderQuery` | Query | Seller order detail |
| `GetSellerOrderStatsQuery` | Query | Seller order stats |
| `ListAdminOrdersQuery` | Query | Paginated admin orders |
| `GetAdminOrderQuery` | Query | Admin order detail |
| `GetAdminOrderStatsQuery` | Query | Admin order stats |

`CalculatePriceBreakdownQuery` is internal to checkout controllers (not exported).

## Cross-module dependencies

| Need | Current bridge | Replaced by (phase) |
|------|----------------|---------------------|
| Cart reads/writes at checkout | `OrderCartIntegration` → `CartQueryService` / `CartCommandService` | Cart module (12+, HTTP cutover 15) |
| Shipping address | `OrderUserAddressIntegration` | User/address module (48+) |
| Payment method catalog | `OrderPaymentMethodIntegration` | Payment module (16+) |
| Review status on order items | `OrderReviewIntegration` | Review module (38+) |
| Inventory reserve/release/fulfill | `InventoryCommandService` | Inventory module (done) |
| Admin list user/shop names | `OrderRepository` relations | `UserQueryService` + `CatalogQueryService` (29–35, 48–49) |

Integrations wrap legacy `_repositories` so this module does not import `src/api/**` or `_repositories/**` directly.

## Layout

```
controllers/     HTTP (buyer checkout/orders, seller orders, admin orders)
application/       Commands, queries, shared utils
domain/            Order entity, status policy, errors
mappers/           API response shapes
repositories/      Order persistence (owns order schema imports)
```

## Rules

- Services/commands own transactions; repositories accept optional `{ tx }`.
- Only `repositories/` imports order Drizzle schema tables.
- API routes and response shapes are unchanged from pre-refactor.
