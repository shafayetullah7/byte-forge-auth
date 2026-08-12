# Inventory module

Stock levels, movements, and seller inventory HTTP API. Order checkout uses `InventoryCommandService` for reserve/release.

## HTTP

| Routes | Controller |
|--------|------------|
| `v1/user/seller/products/:id/inventory` | `SellerInventoryController` |
| `v1/user/seller/products/:id/inventory/movements` | |
| `v1/user/seller/products/:id/inventory/restock` | |
| `v1/user/seller/products/:id/inventory/adjust` | |
| `v1/user/seller/products/:id/inventory/damaged` | |

## Cross-module access

| Consumer | API |
|----------|-----|
| `OrderModule` (place/cancel orders) | `InventoryCommandService` |
| Seller HTTP | `ShopQueryService` (resolve shop by owner) |
