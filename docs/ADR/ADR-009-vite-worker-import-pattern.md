# ADR-009: Vite Worker Import Pattern

## Status

Accepted

## Context

Web Workers need to be bundled and loaded correctly by the build system. Different bundlers have different approaches:
- Webpack: Requires loader configuration and special imports
- Parcel: Automatic worker detection
- Rollup: Plugin-based approach
- Vite: Special import suffix

Totem uses Web Workers for compute-intensive tasks (GME building, MP3 decoding) and needs a reliable way to import and bundle them.

## Decision

**Workers MUST be imported using Vite's `?worker` suffix:**

```typescript
import Worker from "./worker?worker";
```

**This pattern is mandatory and must never be changed.**

## Rationale

1. **Vite Native Support**: First-class Vite feature for worker bundling
2. **Automatic Bundling**: Vite automatically bundles the worker code
3. **Proper Isolation**: Workers run in separate JavaScript contexts
4. **Type Safety**: TypeScript understands the Worker type
5. **ES Module Format**: Workers use modern ES module format
6. **Build Optimization**: Workers are code-split automatically

## Consequences

### Positive
- Workers are properly bundled and code-split
- Clean separation between main thread and worker code
- TypeScript provides type checking for worker code
- No manual webpack loader configuration needed
- Works consistently in development and production
- Hot Module Replacement works for worker code

### Negative
- Vite-specific syntax (not portable to other bundlers without changes)
- Must remember the `?worker` suffix (easy to forget)
- Cannot dynamically choose worker files at runtime
- Worker files must have `.ts` or `.js` extension (not `.worker.ts` specifically, though we use that convention)

## Implementation Details

### Current Workers

**GME Worker:**
```typescript
// src/util/gme/useGmeBuilder.ts
import GmeWorker from "./gme.worker?worker";

const worker = new GmeWorker();
```

**MP3 Decoder Worker:**
```typescript
// src/util/mp3/useLibrary.ts
import Mp3Worker from "./decoder.worker?worker";

const worker = new Mp3Worker();
```

### File Naming Convention

While not required by Vite, we use the `.worker.ts` suffix for clarity:
- `gme.worker.ts` - GME building worker
- `decoder.worker.ts` - MP3 decoding worker

This makes it immediately clear which files are workers.

### Vite Configuration

Workers are configured to use ES module format:
```javascript
// vite.config.mjs
export default defineConfig({
  worker: {
    format: 'es',  // ES module format for workers
  },
})
```

### TypeScript Support

TypeScript understands the `?worker` import through Vite's types:
```typescript
// vite-env.d.ts
/// <reference types="vite/client" />
```

This provides type definitions for special Vite imports including `?worker`.

### Build Output

Vite automatically:
1. Bundles worker code separately
2. Creates a separate chunk file (e.g., `gme.worker-[hash].js`)
3. Provides a Worker constructor that references the bundled worker
4. Handles all necessary paths and loading logic

### Common Mistakes

**❌ Wrong - Regular import:**
```typescript
import worker from "./worker";  // Will import worker code, not create Worker
```

**❌ Wrong - String path:**
```typescript
const worker = new Worker("./worker.ts");  // Won't be bundled by Vite
```

**❌ Wrong - Dynamic import:**
```typescript
const Worker = await import("./worker?worker");  // Possible but unnecessary
```

**✅ Correct - Worker suffix:**
```typescript
import MyWorker from "./worker?worker";
const worker = new MyWorker();
```

## Testing

Unit tests can import worker files directly (without `?worker`) to test worker logic:
```typescript
// In tests only
import { handleMessage } from "./worker";  // Test internal functions
```

Production code must always use `?worker` suffix.

## Migration and Maintenance

**If switching bundlers in the future:**
- Search for all `?worker` imports
- Update to new bundler's pattern
- Test all worker functionality

**When adding new workers:**
1. Create file with `.worker.ts` suffix
2. Import with `?worker` suffix: `import Worker from "./file.worker?worker"`
3. Use ES module format in worker code
4. Test in both development and production builds

## Notes

**This pattern is non-negotiable.** Do not attempt to:
- Use alternative import patterns
- Load workers via string paths
- Change the Vite worker configuration without team discussion

The pattern is documented in:
- `.github/copilot-instructions.md`
- `CONTRIBUTING.md`
- This ADR

**Contributors and AI agents must follow this pattern** when creating or modifying workers.
