# ADR-006: No Mocking in E2E Tests

## Status

Accepted

## Context

Totem has two types of tests:
1. Unit tests (using Bun's test runner) for individual components and utilities
2. E2E tests (using Playwright) for complete user workflows

E2E tests need to validate that the entire application stack works together in a real browser environment. There's a temptation to mock browser APIs or application functions to make tests faster or easier to write.

## Decision

**E2E tests must NEVER mock browser APIs, application functions, or modules.**

**Prohibited in E2E tests:**
- ❌ Mocking `getUserMedia`, `fetch`, `localStorage`, `AudioContext`, etc.
- ❌ Mocking application functions or modules
- ❌ Overriding global objects or prototype methods
- ❌ Stubbing network requests

**Allowed in E2E tests:**
- ✅ Using fixture data files (e.g., test audio files in `e2e/fixtures/`)
- ✅ Pre-populating IndexedDB with real data via `page.evaluate()`
- ✅ Granting browser permissions via Playwright's `context.grantPermissions()`
- ✅ Using real browser APIs exactly as users would

## Rationale

1. **Real User Experience**: E2E tests validate what users actually experience
2. **Integration Validation**: Catches bugs in API interactions that mocks would hide
3. **Browser Compatibility**: Tests real browser behavior, not mock behavior
4. **Confidence**: Passing E2E tests mean the app actually works
5. **Clear Separation**: Mocking belongs in unit tests, not E2E tests

## Consequences

### Positive
- E2E tests provide high confidence that features work end-to-end
- Catches integration bugs between components and browser APIs
- Tests real browser behavior and edge cases
- Validates actual user workflows
- Tests remain valid when implementation changes (as long as UX stays same)

### Negative
- Some features cannot be fully tested in headless CI (e.g., microphone recording)
- Tests may be slower due to real I/O operations
- Tests may be more complex to set up with fixture data
- Requires real test assets (audio files, images, etc.)
- May need different test strategies for hardware-dependent features

## Implementation Details

### Test Structure

**Current E2E test files:**
- `e2e/app.spec.ts` - Basic application and theme tests
- `e2e/oid-codes.spec.ts` - OID code generation tests
- `e2e/audio.spec.ts` - Audio handling tests

### Fixture Data Usage

Instead of mocking file uploads:
```typescript
// ❌ Don't mock
page.evaluate(() => {
  FileReader.prototype.readAsArrayBuffer = () => { /* mock */ };
});

// ✅ Do use real files
const filePath = path.join(__dirname, 'fixtures', 'test-audio.mp3');
await page.setInputFiles('input[type="file"]', filePath);
```

### Pre-populating Data

Instead of mocking storage:
```typescript
// ❌ Don't mock
page.evaluate(() => {
  localStorage.getItem = () => '{"theme":"dark"}';
});

// ✅ Do pre-populate
await page.evaluate(() => {
  localStorage.setItem('theme', 'dark');
});
```

### Hardware Limitations

Some features require real hardware and cannot be fully tested in CI:
```typescript
// Microphone recording - document limitation
test.skip('microphone recording', () => {
  // This test requires real hardware and cannot run in headless CI.
  // Manual QA required. Unit tests cover the recording logic.
});
```

### CI Environment

E2E tests in CI:
- Use chromium-headless-shell for speed
- Build production version first (`bun run build`)
- Run against preview server (`bun run preview`)
- Upload test reports as artifacts

## Notes

**If you need mocking to test something, it's probably not an E2E test.**

Consider instead:
1. **Unit test** - Test the logic with mocks in isolation
2. **Integration test** - Test component interactions with real APIs
3. **Manual QA** - For hardware-dependent features

This decision is documented in:
- `CONTRIBUTING.md` - Test guidelines section
- `.github/copilot-instructions.md` - E2E testing guidelines

**Contributors and AI agents must follow this rule.** Violations should be caught in code review.
