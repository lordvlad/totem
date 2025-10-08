# ADR-002: Web Workers for Compute-Intensive Tasks

## Status

Accepted

## Context

Totem performs several computationally intensive operations:
- Decoding MP3 files and extracting metadata
- Building binary GME files with XOR encoding
- Generating OID (Optical Identification) code patterns

Running these operations on the main thread would block the UI and create a poor user experience.

## Decision

Use Web Workers for all compute-intensive tasks to keep the main UI thread responsive.

**Current Workers:**
- `src/util/gme/gme.worker.ts` - GME file building and encoding
- `src/util/mp3/decoder.worker.ts` - MP3 decoding and metadata extraction

**Worker Import Pattern:**
Workers must be imported using Vite's special `?worker` suffix:
```typescript
import Worker from "./worker?worker";
```

## Rationale

1. **Responsiveness**: Keeps UI interactive during heavy computations
2. **Parallelism**: Can leverage multi-core CPUs for concurrent processing
3. **Separation of Concerns**: Clean separation between UI logic and computational logic
4. **Error Isolation**: Worker crashes don't affect main thread
5. **Modern Standard**: Web Workers are well-supported across modern browsers

## Consequences

### Positive
- UI remains responsive during long operations (GME building, MP3 decoding)
- Can process multiple files concurrently
- Clear architectural boundary between UI and computation
- Progress reporting without blocking the main thread
- Better utilization of multi-core processors

### Negative
- Cannot directly access DOM from workers
- Data must be serialized/deserialized when passing between main thread and workers
- Slightly more complex code structure with message passing
- Debugging can be more challenging
- Must use structured clone algorithm for data transfer (or Transferable objects)

## Implementation Details

### Worker Communication Pattern
Workers communicate via message passing with structured events:
- Request events (e.g., `{ event: "build", ...config }`)
- Response events (e.g., `{ event: "progress", n, total }`)
- Error events (e.g., `{ event: "error", error: string }`)

### Vite Configuration
Workers are configured in `vite.config.mjs`:
```javascript
worker: {
  format: 'es',  // ES module format for workers
}
```

### Data Transfer
- Large binary data uses Transferable objects (ArrayBuffer) when possible
- Audio data stored in IndexedDB to avoid repeated serialization
- Streaming APIs (ReadableStream) used for GME file generation

## Notes

Workers are mandatory for these operations - do not refactor to run on main thread as it will severely impact user experience.
