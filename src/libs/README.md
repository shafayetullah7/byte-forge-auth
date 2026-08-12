# Shared libraries (`src/libs/`)

Infrastructure shared across domain modules: guards, config, email, events, middleware, security, utils, and **canonical DB transaction types** (`libs/db/types/`).

Domain business logic does **not** belong here — use `src/modules/{domain}/`.

See [docs/architecture.md](../../docs/architecture.md).
