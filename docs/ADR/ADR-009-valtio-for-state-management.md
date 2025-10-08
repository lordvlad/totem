# ADR-009: Valtio for State Management

## Status

Accepted

## Context

Totem needs client-side state management for various application concerns:
- User preferences (language, theme, layout options)
- Project configuration (OID codes, print settings)
- UI state (help panel visibility, selected tracks)
- Cross-component shared state

Traditional React state management options include:
- React Context API (verbose, performance issues with frequent updates)
- Redux (heavy, boilerplate-intensive)
- MobX (complex, requires decorators)
- Zustand (lightweight, hook-based)
- Valtio (proxy-based, minimal API)

## Decision

Use Valtio for state management across the application.

**Key Usage:**
- Global state defined using `proxy()`
- Components subscribe via `useSnapshot()`
- State changes trigger automatic re-renders
- Side effects handled with `subscribe()`
- Persistence to localStorage where needed

## Rationale

1. **Minimal API**: Simple `proxy()`, `useSnapshot()`, `subscribe()` functions
2. **Performance**: Proxy-based reactivity only re-renders affected components
3. **Developer Experience**: Mutate state directly, no reducers or actions needed
4. **Bundle Size**: Very lightweight (~3KB), much smaller than Redux
5. **TypeScript**: Excellent type inference with zero configuration
6. **React Integration**: Works naturally with React hooks
7. **No Boilerplate**: No providers, stores, or action creators required

## Consequences

### Positive
- Minimal boilerplate for state management
- Excellent TypeScript support with automatic type inference
- Performant fine-grained reactivity
- Easy to persist state (works well with localStorage)
- Simple to understand and debug (state is just an object)
- No learning curve for team members familiar with vanilla objects
- Can subscribe to state changes for side effects (e.g., localStorage sync)

### Negative
- Less ecosystem/community compared to Redux
- Proxy-based approach may confuse developers expecting traditional state management
- Cannot use in environments without Proxy support (not an issue for modern browsers)
- Limited middleware/plugin ecosystem
- Requires understanding of JavaScript Proxies for advanced usage
- State mutations are direct, which may feel unfamiliar to Redux users

## Implementation Details

### Basic Pattern

**Define State:**
```typescript
import { proxy } from "valtio";

const state = proxy({
  locale: "en-US",
  theme: "auto",
});
```

**Use in Components:**
```typescript
import { useSnapshot } from "valtio";

function MyComponent() {
  const snap = useSnapshot(state);
  return <div>Current locale: {snap.locale}</div>;
}
```

**Update State:**
```typescript
// Direct mutation
state.locale = "de-DE";

// Or from a function
function setLocale(locale: string) {
  state.locale = locale;
}
```

### Real Usage Examples

**Locale Management (`src/hooks/useI18n/useLocale.ts`):**
```typescript
const localeProxy = proxy<{ locale: Locale }>({
  locale: localStorage.getItem("lang") ?? "en-US",
});

subscribe(localeProxy, () => {
  document.documentElement.lang = localeProxy.locale;
  localStorage.setItem("lang", localeProxy.locale);
});

export function useLocale() {
  return useSnapshot(localeProxy).locale;
}

export function setLocale(locale: Locale) {
  localeProxy.locale = locale;
}
```

**Options Management (`src/hooks/useOptions.tsx`):**
```typescript
const optionsProxy = proxy({
  projectName: "My Tiptoi Book",
  productId: 0,
  layout: "tiles",
  // ... more options
});

// Auto-save to IndexedDB on changes
subscribe(optionsProxy, debounce(() => {
  void set(getProjectKey("options"), optionsProxy);
}, 500));
```

**Selection State (`src/hooks/selection.ts`):**
```typescript
const selectionState = proxy({
  selectedIndices: new Set<number>(),
});

export function useSelection() {
  const snap = useSnapshot(selectionState);
  return {
    selected: snap.selectedIndices,
    select: (idx: number) => selectionState.selectedIndices.add(idx),
    // ...
  };
}
```

### Integration with Persistence

Valtio works seamlessly with IndexedDB and localStorage:
```typescript
// Load from storage on init
const state = proxy({
  ...initialState,
  ...await get(storageKey),
});

// Save on changes
subscribe(state, debounce(() => {
  void set(storageKey, state);
}, 500));
```

### Current Usage in Totem

Valtio is used in:
- `src/hooks/useI18n/useLocale.ts` - Language selection
- `src/hooks/useOptions.tsx` - Project and layout options
- `src/hooks/useTestPrintMode.tsx` - Test mode state
- `src/hooks/useCurrentProject.tsx` - Current project tracking
- `src/hooks/selection.ts` - Track selection state
- `src/components/HelpPanel/useHelpPanel.ts` - Help panel visibility

## Alternatives Considered

### Redux
- ❌ Too heavy (~40KB)
- ❌ Requires actions, reducers, excessive boilerplate
- ✅ Large ecosystem, well-documented
- ✅ DevTools support

### Zustand
- ✅ Lightweight, simple API
- ✅ Good TypeScript support
- ❌ Still requires defining actions/setters
- ❌ Less elegant than Valtio's direct mutations

### React Context
- ✅ Built into React
- ❌ Performance issues with frequent updates
- ❌ Verbose provider tree
- ❌ No built-in persistence helpers

### MobX
- ✅ Powerful reactivity
- ❌ Complex API with decorators
- ❌ Larger bundle size
- ❌ Steeper learning curve

## Notes

Valtio's proxy-based approach aligns well with Totem's philosophy:
- Simple, direct, no magic
- Minimal dependencies
- Modern JavaScript features
- Excellent developer experience

The direct mutation style may be surprising to developers expecting immutable updates (Redux style), but it's intentional and leverages JavaScript Proxies for change tracking.

**Do not replace Valtio** without strong justification. The minimal API and excellent TypeScript support make it ideal for this project's needs.
