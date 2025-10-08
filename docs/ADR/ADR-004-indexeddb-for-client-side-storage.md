# ADR-004: IndexedDB for Client-Side Storage

## Status

Accepted

## Context

With a client-side only architecture, Totem needs to store:
- Audio file data (potentially large MP3/OGG files)
- Track metadata (title, artist, album art)
- Project state and configuration
- Multiple projects simultaneously

Browser storage options include:
- LocalStorage (limited to ~5-10MB, synchronous)
- SessionStorage (cleared on tab close)
- IndexedDB (large capacity, asynchronous)
- File System Access API (requires user permission for each file)

## Decision

Use IndexedDB via the `idb-keyval` library for client-side storage of audio data and track metadata.

**Implementation:**
- Library: `idb-keyval` (simple key-value wrapper around IndexedDB)
- Storage keys use project-scoped namespacing: `project:${uuid}:${key}`
- Audio data stored as `Uint8Array`
- Metadata stored as JSON-serializable objects

**Key Patterns:**
```typescript
// Storage keys
`project:${projectUuid}:data:${trackUuid}`  // Audio binary data
`project:${projectUuid}:track:${trackUuid}` // Track metadata

// Fallback for backward compatibility
currentProjectUuid == null ? key : `project:${projectUuid}:${key}`
```

## Rationale

1. **Capacity**: IndexedDB can store large amounts of data (limited by disk space)
2. **Asynchronous**: Non-blocking API doesn't freeze the UI
3. **Structured Data**: Can store binary data (Uint8Array) and objects
4. **Persistence**: Data survives browser restarts
5. **Simple API**: `idb-keyval` provides Promise-based get/set interface
6. **Multi-Project Support**: Namespace pattern enables multiple projects

## Consequences

### Positive
- Can store large audio files without memory constraints
- Fast retrieval of frequently accessed data
- Persistent storage across browser sessions
- Non-blocking operations maintain UI responsiveness
- Support for multiple concurrent projects
- No network latency

### Negative
- Storage quota subject to browser policies (user can deny or clear)
- No automatic synchronization between devices
- Data only available in the browser where it was stored
- Requires user to manually export/import projects for backup
- Storage can be cleared by browser maintenance tasks

## Implementation Details

### Storage Access Pattern

**In Workers:**
Workers access IndexedDB directly using `idb-keyval`:
```typescript
import { get, set } from 'idb-keyval';

// Store audio data
await set(getProjectKey(`data:${uuid}`), uint8Array);

// Retrieve for GME building
const data = await get<Uint8Array>(getProjectKey(`data:${trackUuid}`));
```

**Project Scoping:**
Each project has a UUID, and all related data is namespaced:
```typescript
function getProjectKey(key: string): string {
  if (currentProjectUuid == null) {
    return key; // Backward compatibility
  }
  return `project:${currentProjectUuid}:${key}`;
}
```

### Data Types Stored

1. **Audio Data**: `Uint8Array` - Raw decoded audio
2. **Track Metadata**: Object with `{ fileName, title, artist, duration, art, uuid }`
3. **Configuration**: Various settings and state

### Worker Integration

Workers receive `projectUuid` in their initialization:
```typescript
// In worker
let currentProjectUuid: string | null = null;

// On load event
currentProjectUuid = event.data.projectUuid ?? null;
```

## Notes

<!-- FIXME: Document data migration strategy when breaking changes are needed -->

The backward compatibility path (`currentProjectUuid == null`) ensures existing data continues to work after the introduction of multi-project support.

IndexedDB storage is specific to the origin (domain + protocol + port), so data is isolated per deployment environment.
