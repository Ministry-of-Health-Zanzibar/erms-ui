# Frontend architecture

The application is organized by responsibility while preserving the existing routes and business flow.

- `auth/` contains authentication screens and their routing.
- `pages/` contains business features. New code imports this boundary through `@features/*`.
- `services/` contains singleton services, guards, and interceptors. New code imports this boundary through `@core/*`.
- `@app/` contains the authenticated application shell (header, sidebar, and startup loader). New code imports it through `@layout/*`.
- `@shared/` contains reusable, business-neutral UI, utilities, skeletons, and widgets.
- `error/` contains application-level error pages.

## Dependency direction

`app shell -> features -> core/shared`

Shared UI must not import a business feature. Core services must not import feature components. Features may use core services and shared UI.

## Migration policy

The aliases provide stable boundaries without changing route URLs or runtime behavior. Existing relative imports remain supported and should be migrated feature by feature, with Angular compilation after every batch. The legacy `@services/*` alias remains temporarily compatible; new imports should use `@core/*`.
