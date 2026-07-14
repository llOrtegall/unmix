# 0028 — Adopt the clean-architecture skills

- **Status:** Accepted
- **Date:** 2026-10-28
- **Supersedes:** [0013](0013-result-type.md), [0015](0015-manual-composition-root.md)
- **Amends:** [0011](0011-clean-architecture-ddd.md), [0017](0017-frontend-clean-zustand.md), [0018](0018-dependency-rules-in-ci.md)

## Context

The three services follow Clean Architecture loosely: ports and adapters with a single composition root, mutable aggregates, business errors as `Result` values, and use cases as classes. The owner now keeps a set of shared rules, the `clean-architecture-core` skill plus one skill per stack (`-ts-backend`, `-python`, `-frontend`), and wants every project to follow them to the letter so code reads the same everywhere.

## Decision

Refactor the API, the worker and the web to those skills, in that order, keeping the app working at the end of every step.

- **Modules with three layers.** `modules/<context>/{domain,application,infrastructure}`. Entrypoints (routes, middlewares, queue consumers, jobs, hooks, components, pages) live outside `modules/` and call one use case from the module factory.
- **Rich, immutable domain.** Every attribute is a Value Object. Value Objects, Entities and `XList` collections have a private constructor, `create` with `ensure*` guards, `fromPrimitive` / `toPrimitive`, and `equals`. Modifiers return new instances.
- **Typed domain errors** replace `Result`. Every error extends `ValidationError`, `NotFoundError`, `ConflictError` or `ForbiddenError` and carries a stable code (`track.not_found`). They are mapped to HTTP in one error handler (`{ code, message }`: 422, 404, 409, 403; 400 for a malformed request). On the web, one dictionary maps them to text. The worker turns validation and not-found failures into non-retryable jobs.
- **Curried use cases and module factories** replace use case classes and the composition root. Every class that talks to the outside world is a `*Repository`, with its interface in `domain/`.
- **Ids and time come from the domain** (`crypto.randomUUID()`, `uuid.uuid4()`, `new Date()` in named factories). The `Clock` and `IdGenerator` ports are removed.
- **Tests sit beside the module** (`modules/<m>/test`, or `tests/modules/<m>` in Python) and use Object Mothers and RepositoryMothers with faker. Infrastructure tests use Testcontainers, HTTP tests use Fastify `inject`, and component tests use Testing Library.

Adaptations the skills leave open:

- Node runs TypeScript without a build step ([ADR 0022](0022-typescript-without-build.md)), and `erasableSyntaxOnly` forbids parameter properties. Fields are declared explicitly and imports keep their `.ts` extension.
- Transactions are a `TransactionRepository`. A coordinating use case runs an inner use case inside it, so side effects outside the database (deleting files) still happen after the commit.
- Domain events and the outbox ([ADR 0014](0014-transactional-outbox.md), [ADR 0021](0021-in-process-events-and-reconciliation.md)) stay. Entities carry an immutable list of recorded events, and use cases publish them through an `EventRepository`. In-process reactions are use cases subscribed from a consumer entrypoint.
- The worker's use case stays synchronous, because it is CPU-bound and runs in a thread.
- The shadcn primitives in `components/ui/` stay as vendored code.
- Browser e2e keeps running against the real Docker stack instead of mocking the backend.

## Consequences

- One shape of code across the three services and the owner's other projects.
- More files and more mapping: every attribute gets a Value Object, and every boundary maps primitives.
- The HTTP error body and the separation failure codes change. Web, API, worker and contracts move together.
- [ADR 0013](0013-result-type.md) and [ADR 0015](0015-manual-composition-root.md) no longer apply. [ADR 0011](0011-clean-architecture-ddd.md), [ADR 0017](0017-frontend-clean-zustand.md) and [ADR 0018](0018-dependency-rules-in-ci.md) keep their intent with the layout above. Identity becomes a small module instead of a bare Better Auth integration.
