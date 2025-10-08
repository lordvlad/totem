# ADR-005: GME File Format Implementation

## Status

Accepted

## Context

Totem generates GME (Game Mode Electronics) files - a proprietary binary format used by Ravensburger's Tiptoi pen system. The format specification was reverse-engineered by the [tttool project](https://github.com/entropia/tip-toi-reveng).

The GME file contains:
- Binary header with magic numbers and offsets
- Script tables mapping OID codes to actions
- Media tables referencing audio data
- XOR-encoded audio data
- Special codes for system functions (replay, stop, power-on)

## Decision

Implement GME file generation entirely in TypeScript within the browser, based on the reverse-engineered specification from the tttool project.

**Implementation:** `src/util/gme/gme.ts` (~724 lines)

**Key Components:**
- Binary layout construction using DataView
- XOR encoding with magic values (0xad for magic XOR, 0x39 for raw XOR)
- Script table generation from OID mappings
- Media table with audio file references
- Special codes table for system functions
- Validation using tttool binary in tests

## Rationale

1. **Browser Native**: Enables client-side generation without server dependency
2. **Complete Control**: Can customize and extend the format as needed
3. **Learning Resource**: Serves as a documented TypeScript implementation of the format
4. **Performance**: Direct binary generation is fast enough for typical use cases
5. **Validation**: Can verify correctness using tttool binary in tests

## Consequences

### Positive
- No dependency on external services for GME generation
- Fast generation (Web Worker handles heavy computation)
- Full control over format extensions
- Can iterate on features without waiting for upstream tttool updates
- Serves as readable documentation of the GME format

### Negative
- Large source file (~724 lines) that's hard to split due to interconnected layout
- Must manually track changes to GME format specification
- Potential bugs if format implementation diverges from specification
- No automatic updates from upstream tttool improvements
- Complexity in binary layout and offset management

## Implementation Details

### Binary Layout Structure

The implementation uses a functional approach with layout items:
```typescript
interface LayoutItem {
  write({ view }: Buf): void;
  size: number;
}
```

### Key Format Elements

1. **Header**: Fixed structure with version, language, product ID
2. **Magic Number**: `0x0000238b` (Ravensburger customer number at Chomptech)
3. **XOR Encoding**: Media data XOR-encoded with `0xad` (magic) or `0x39` (raw)
4. **Offsets**: 32-bit offsets to tables (script, media, special codes)
5. **Script Commands**: 16-bit command codes (e.g., `0xffe8` for play)

### Script Commands
```typescript
const commands = {
  play: 0xffe8,      // P(m): play audio
  playAll: 0xffe1,   // PA*(): play all samples
  jump: 0xf8ff,      // J(m): jump to script
  cancel: 0xfaff,    // C: cancel game mode
  // ... etc
};
```

### Validation Strategy

Tests use the tttool binary to validate generated GME files:
```bash
tttool info generated.gme  # Validates structure
tttool play generated.gme  # Tests audio playback
```

### Configuration Interface
```typescript
export interface GmeBuildConfig {
  productId: number;           // Unique product identifier
  tracks: Track[];             // Audio tracks
  language: "GERMAN" | "DUTCH" | "FRENCH" | "ITALIAN" | "RUSSIAN" | "ENGLISH";
  comment?: string;            // Optional comment in header
  initialRegisterValues?: number[];
  scripts?: Record<number, ScriptLine[]>;  // OID -> Script mapping
  replayOid?: number;          // OID for replay function
  stopOid?: number;            // OID for stop function
  powerOnSounds?: number[];    // Sounds to play on power-on
}
```

## Notes

The implementation is primarily based on:
- [GME Format Documentation](https://github.com/entropia/tip-toi-reveng/blob/master/GME-Format.md)
- Example files from tttool test suite

<!-- FIXME: Monitor tttool project for format updates and breaking changes -->

ESLint's `max-lines` and `complexity` rules are disabled for `gme.ts` because:
- The file implements a complex binary format with interdependent sections
- Splitting would require extensive refactoring with questionable benefit
- The current structure mirrors the format specification for maintainability

**Do not attempt to refactor this file** unless specifically addressing a GME format bug or feature.
