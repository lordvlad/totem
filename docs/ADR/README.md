# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) documenting key architectural decisions made in the Totem project.

## What are ADRs?

Architecture Decision Records document important architectural decisions along with their context and consequences. They help current and future contributors understand why the project is structured the way it is.

## Index of ADRs

- [ADR-001: Client-Side Only Architecture (No Backend)](./ADR-001-client-side-only-architecture.md)
- [ADR-002: Web Workers for Compute-Intensive Tasks](./ADR-002-web-workers-for-compute-intensive-tasks.md)
- [ADR-003: Bun as Package Manager and Runtime](./ADR-003-bun-as-package-manager-and-runtime.md)
- [ADR-004: Static Site Generation with Vite](./ADR-004-static-site-generation-with-vite.md)
- [ADR-005: IndexedDB for Client-Side Storage](./ADR-005-indexeddb-for-client-side-storage.md)
- [ADR-006: No Mocking in E2E Tests](./ADR-006-no-mocking-in-e2e-tests.md)
- [ADR-007: TypeScript Strict Mode](./ADR-007-typescript-strict-mode.md)
- [ADR-008: Multi-Language Support via i18n Hook](./ADR-008-multi-language-support-via-i18n-hook.md)
- [ADR-009: Valtio for State Management](./ADR-009-valtio-for-state-management.md)

## ADR Format

Each ADR follows this structure:

- **Status**: Accepted, Proposed, Deprecated, or Superseded
- **Context**: The issue motivating this decision
- **Decision**: The change or solution being proposed
- **Rationale**: Why this decision was made
- **Consequences**: Impact of the decision (positive and negative)
- **Implementation Details**: Technical details of how it's implemented
- **Notes**: Additional information, TODOs, or FIXMEs

## When to Create a New ADR

Create a new ADR when:

- Making a significant architectural decision
- Choosing between multiple technical approaches
- Establishing a new pattern or convention
- Deprecating or changing an existing pattern
- Implementing a feature that affects the overall architecture

**Do NOT create ADRs for:**
- Bug fixes that don't change architecture
- Minor code improvements
- Documentation updates (unless they reflect architectural changes)
- Dependency version updates

## How to Create a New ADR

1. Copy the template from an existing ADR
2. Number it sequentially (ADR-011, ADR-012, etc.)
3. Use a descriptive filename: `ADR-XXX-brief-description.md`
4. Fill in all sections:
   - Context (why is this needed?)
   - Decision (what are we doing?)
   - Rationale (why this approach?)
   - Consequences (what are the trade-offs?)
5. Include the ADR in your PR
6. **Wait for review and confirmation** before implementing
7. Update this README.md to include the new ADR in the index

## ADR Review Process

**All new ADRs require review and confirmation:**

1. **Propose**: Submit ADR in PR with status "Proposed"
2. **Review**: Maintainers and contributors review the decision
3. **Discuss**: Address feedback and concerns
4. **Approve**: Once approved, status changes to "Accepted"
5. **Implement**: Only then proceed with implementation

**For contributors (including AI agents):**
- Check if your feature/fix requires a new ADR
- If yes, include the ADR in your PR
- Wait for ADR confirmation before continuing implementation
- Ensure your implementation adheres to existing ADRs

## Relationship to Other Documentation

- **CONTRIBUTING.md**: References ADRs for specific development practices
- **.github/copilot-instructions.md**: References ADRs for AI-assisted development
- **README.md**: User-facing documentation (no ADR references)

ADRs are for **contributors and maintainers**, not end users.
