# Shared libraries (`src/libs/`)

Infrastructure shared across domain modules: guards, config, DB helpers, email, events, and **canonical DB transaction types**.

Domain business logic does **not** belong here — use `src/modules/{domain}/`.

During the refactor, `src/common/` is the legacy location; new shared infra should go under `src/libs/`.

See [docs/architecture.md](../../docs/architecture.md).
