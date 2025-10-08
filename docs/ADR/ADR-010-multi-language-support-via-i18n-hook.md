# ADR-010: Multi-Language Support via i18n Hook

## Status

Accepted

## Context

Totem targets users across multiple European countries where Tiptoi pens are popular. Users need the interface in their native language to effectively create audio books for their children.

Requirements:
- Support multiple languages (German, English, Spanish, French, Italian)
- Fast language switching without page reload
- Minimal bundle size impact
- Simple API for developers
- Works with React components

## Decision

Implement internationalization using a custom React hook (`useI18n`) with locale-specific dictionaries, avoiding heavy i18n libraries.

**Supported Languages:**
- `de_DE` - German (Deutsch)
- `en_US` - English (default)
- `es_ES` - Spanish (Español)
- `fr_FR` - French (Français)
- `it_IT` - Italian (Italiano)

**Implementation:**
- Custom React hook: `src/hooks/useI18n/index.tsx`
- Locale files: `src/hooks/useI18n/{locale}.ts`
- Template literal syntax with tagged template function
- Valtio for state management

## Rationale

1. **Lightweight**: No heavy i18n library dependencies (react-i18next is ~100KB)
2. **Type Safety**: TypeScript ensures all translations exist
3. **Developer Experience**: Template literal syntax is intuitive
4. **Performance**: Direct object lookups, no runtime parsing
5. **Bundle Size**: Only selected language loaded (code splitting possible)
6. **Simplicity**: Easy to add new translations

## Consequences

### Positive
- Minimal bundle size impact (~2KB per language)
- Fast runtime performance (simple object lookup)
- Type-safe translations (missing keys caught at compile time)
- Clean API with template literals
- Easy to add new languages
- No complex pluralization or interpolation logic needed
- Works seamlessly with React

### Negative
- No advanced features (pluralization rules, number formatting, date formatting)
- Must manually maintain translation files
- No automated translation management
- Limited to simple string replacement
- Cannot dynamically load translations per route
- No translation context or namespacing

## Implementation Details

### Hook API

**Basic Usage:**
```typescript
import { useI18n } from "@/hooks/useI18n";

function MyComponent() {
  const { i18n } = useI18n();
  
  return <h1>{i18n`Welcome to Totem`}</h1>;
}
```

**With Variables:**
```typescript
const count = 5;
return <p>{i18n`You have ${count} tracks`}</p>;
```

### Locale File Structure

Each locale file exports a dictionary:
```typescript
// src/hooks/useI18n/de_DE.ts
export const de_DE = {
  "Welcome to Totem": "Willkommen bei Totem",
  "You have {{0}} tracks": "Du hast {{0}} Titel",
  "Choose Files": "Dateien auswählen",
  // ...
};
```

### State Management

Language selection stored in Valtio state:
```typescript
import { proxy } from "valtio";

const state = proxy({
  locale: "en_US",
});
```

### Language Switching

Users can switch languages via UI:
```typescript
import { setLocale } from "@/hooks/useI18n";

function LanguageSelector() {
  return (
    <select onChange={(e) => setLocale(e.target.value)}>
      <option value="en_US">English</option>
      <option value="de_DE">Deutsch</option>
      {/* ... */}
    </select>
  );
}
```

### Translation Keys

**Key Format:**
- Keys are English strings (source language)
- Variables use `{{0}}`, `{{1}}`, etc. for positional replacement
- Keys should be descriptive of content, not context

**Best Practices:**
```typescript
// ✅ Good - descriptive
i18n`Save Audio Book`
i18n`Your music files will show up here`

// ❌ Bad - too generic
i18n`Button Label`
i18n`Text`
```

### Adding New Translations

1. Add English string in component: `i18n\`New Feature\``
2. Run application, string shows in English by default
3. Add translations to each locale file:
   - `de_DE.ts`: `"New Feature": "Neue Funktion"`
   - `es_ES.ts`: `"New Feature": "Nueva Característica"`
   - `fr_FR.ts`: `"New Feature": "Nouvelle Fonctionnalité"`
   - `it_IT.ts`: `"New Feature": "Nuova Funzionalità"`

### README Localization

Each language has a localized README:
- `README.md` (English - default)
- `README.de_DE.md` (German)
- `README.es_ES.md` (Spanish)
- `README.fr_FR.md` (French)
- `README.it_IT.md` (Italian)

These are maintained separately and imported via vite-plugin-markdown.

## Limitations

### No Pluralization
```typescript
// Simple approach (current)
i18n`${count} tracks`  // "1 tracks" (grammatically incorrect)

// Would need manual handling
i18n`${count === 1 ? 'track' : 'tracks'}`
```

### No Number Formatting
```typescript
// No automatic formatting
i18n`Size: ${size} MB`  // "Size: 1234.56 MB"

// Would need manual formatting
i18n`Size: ${size.toLocaleString(locale)} MB`
```

### No Date Formatting
```typescript
// Manual date formatting required
const dateStr = date.toLocaleDateString(locale);
```

## Future Considerations

<!-- FIXME: Consider migrating to a full i18n library if complexity grows -->

If future requirements include:
- Complex pluralization rules
- Number/currency/date formatting
- Translation management tools
- Dynamic translation loading
- RTL language support

Then consider migrating to a full-featured i18n library like `react-i18next` or `FormatJS`.

For now, the simple approach meets all current needs without added complexity.

## Notes

**When adding new UI text:**
1. Write it in English in the component
2. Add translations to ALL locale files (de_DE, es_ES, fr_FR, it_IT)
3. Test language switching to verify translations appear

**Contributors must provide translations** for all supported languages or mark missing translations with a comment:
```typescript
// TODO: Translate to Spanish
"New Feature": "New Feature",
```
