# ADR-007: TypeScript Strict Mode

## Status

Accepted

## Context

TypeScript offers various levels of type checking strictness. The project needs to balance:
- Type safety and bug prevention
- Development velocity
- Code maintainability
- Onboarding new contributors

## Decision

Enable TypeScript strict mode with additional strictness flags to catch potential bugs at compile time.

**TypeScript Configuration (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

**Key Enabled Checks:**
- `strict: true` - Enables all strict type checking options
  - `noImplicitAny`
  - `strictNullChecks`
  - `strictFunctionTypes`
  - `strictBindCallApply`
  - `strictPropertyInitialization`
  - `noImplicitThis`
  - `alwaysStrict`
- `noUnusedLocals: true` - Disallows unused local variables
- `noUnusedParameters: true` - Disallows unused function parameters

## Rationale

1. **Bug Prevention**: Catches null/undefined errors at compile time
2. **Code Quality**: Forces explicit type annotations
3. **Refactoring Safety**: Type errors surface during refactoring
4. **Documentation**: Types serve as inline documentation
5. **IDE Support**: Better autocomplete and type hints
6. **Maintainability**: Easier to understand code intent

## Consequences

### Positive
- Many runtime errors prevented at compile time
- Null/undefined handling is explicit
- Unused code is flagged (helps prevent dead code)
- Better IDE/editor support (autocomplete, refactoring)
- Type errors caught before runtime
- Forces consideration of edge cases
- New contributors get immediate feedback on type errors

### Negative
- More verbose code (explicit types required in many places)
- Steeper learning curve for TypeScript beginners
- Some valid JavaScript patterns require workarounds
- Type assertions (`as Type`) sometimes needed for complex types
- External library types may be incomplete (requires `@types/*` packages)

## Implementation Details

### Strictness Exceptions

**ESLint Configuration:**
Some TypeScript-ESLint rules are disabled to allow practical patterns:
```javascript
// eslint.config.mjs
rules: {
  '@typescript-eslint/explicit-function-return-type': 'off',  // Inferred return types OK
  '@typescript-eslint/no-magic-numbers': 'off',  // Literals OK in binary format code
  '@typescript-eslint/no-confusing-void-expression': 'off',  // Async handlers
}
```

**File-Level Exceptions:**
Some files disable specific checks:
```typescript
// src/util/gme/gme.ts
/* eslint-disable complexity -- really not so complex */
/* eslint-disable max-lines -- TODO refactor into more chunks */
```

### Common Patterns

**Null Checks:**
```typescript
// ✅ Strict null checks enforced
if (value === null || value === undefined) {
  return defaultValue;
}

// ✅ Nullish coalescing
const result = value ?? defaultValue;

// ✅ Optional chaining
const name = user?.profile?.name;
```

**Type Guards:**
```typescript
// Custom type guard functions
export function isReq(x: unknown): x is Req {
  return x != null && typeof x === "object" && "event" in x;
}
```

**Unknown vs Any:**
```typescript
// ✅ Prefer 'unknown' for truly unknown types
function handleError(e: unknown) {
  if (e instanceof Error) {
    console.error(e.message);
  }
}

// ❌ Avoid 'any' unless absolutely necessary
```

### Build Integration

**Vite Plugin:**
TypeScript checking is integrated into the build:
```javascript
// vite.config.mjs
checker({ typescript: true })
```

This runs TypeScript compiler alongside the build to catch type errors.

### CI Enforcement

Type checking runs in CI:
```bash
bun run build  # Includes TypeScript checking via vite-plugin-checker
```

Build fails if type errors exist.

## Notes

**Do not disable strict mode** or relax these settings without strong justification and team discussion.

**When encountering type errors:**
1. First try to fix the underlying type issue
2. Consider if the code can be restructured to be type-safe
3. As a last resort, use type assertions with comments explaining why

**Type assertions should be rare and documented:**
```typescript
// Type assertion justified by...
const element = document.querySelector('.class') as HTMLElement;
```

This configuration balances strict type safety with practical development needs. The disabled ESLint rules allow common patterns while maintaining type safety.
