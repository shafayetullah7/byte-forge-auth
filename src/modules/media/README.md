# Media module

User and admin file uploads (Cloudinary-backed).

## HTTP

| Audience | Routes | Controller |
|----------|--------|------------|
| User | `v1/media` | `MediaController` |
| Admin | `admin/media` | `AdminMediaController` |

## Cross-module access

| Consumer | API |
|----------|-----|
| Shop, catalog, payment | `MediaRepository` (import `MediaModule`) |

Exports `MediaRepository` and `MediaService`.
