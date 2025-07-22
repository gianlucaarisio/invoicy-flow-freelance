# Design Document

## Overview

This design implements a comprehensive Italian translation system for the React application using react-i18next, a mature and widely-adopted internationalization library. The solution provides a scalable, maintainable approach to translating all user-facing text while preserving the existing application structure and functionality.

The design follows modern i18n best practices with centralized translation management, type-safe translation keys, and efficient bundle loading. The implementation will be transparent to existing components through a hook-based API that seamlessly replaces hardcoded strings.

## Architecture

### Core Components

**Translation Provider System**

- `I18nProvider`: React context provider wrapping the entire application
- `useTranslation` hook: Primary interface for accessing translations in components
- Translation namespace organization for logical grouping of related strings
- Fallback mechanism to English when Italian translations are missing

**Translation File Structure**

```
src/locales/
├── it/
│   ├── common.json          # Common UI elements (buttons, labels, etc.)
│   ├── auth.json           # Authentication pages
│   ├── dashboard.json      # Dashboard page
│   ├── documents.json      # Documents management
│   ├── clients.json        # Client management
│   ├── forms.json          # Form labels and validation
│   └── errors.json         # Error messages
└── en/
    └── [same structure]    # English fallback translations
```

**Integration Points**

- App.tsx: Wrap application with I18nProvider
- Component level: Replace hardcoded strings with translation hooks
- Form validation: Translate Zod error messages
- Toast notifications: Translate all user feedback messages
- Date/number formatting: Apply Italian locale formatting

### Translation Key Naming Convention

**Hierarchical Structure**

- `page.section.element`: For page-specific content
- `common.action.verb`: For reusable UI elements
- `form.field.label`: For form-related text
- `error.type.message`: For error messages

**Examples**

```typescript
// Dashboard translations
t("dashboard.header.title"); // "Dashboard"
t("dashboard.stats.totalClients"); // "Clienti Totali"
t("common.actions.create"); // "Crea"
t("common.actions.edit"); // "Modifica"
```

## Components and Interfaces

### I18n Configuration

**react-i18next Setup**

```typescript
// src/i18n/config.ts
interface I18nConfig {
  defaultLanguage: "it";
  fallbackLanguage: "en";
  namespaces: string[];
  interpolation: {
    escapeValue: false; // React already escapes
  };
}
```

**Translation Hook Interface**

```typescript
// Enhanced useTranslation hook
interface TranslationHook {
  t: (key: string, options?: TranslationOptions) => string;
  i18n: I18NextInstance;
  ready: boolean;
}

interface TranslationOptions {
  count?: number; // For pluralization
  context?: string; // For contextual translations
  defaultValue?: string; // Fallback text
  interpolation?: Record<string, any>; // Variable substitution
}
```

### Component Integration Pattern

**Translation Hook Usage**

```typescript
// Before
const Dashboard = () => {
  return <h1>Dashboard</h1>;
};

// After
const Dashboard = () => {
  const { t } = useTranslation("dashboard");
  return <h1>{t("header.title")}</h1>;
};
```

**Form Integration**

```typescript
// Form with translated labels and validation
const LoginForm = () => {
  const { t } = useTranslation("auth");

  const schema = z.object({
    email: z.string().email(t("validation.emailInvalid")),
    password: z.string().min(6, t("validation.passwordTooShort")),
  });

  return (
    <form>
      <Label>{t("form.email.label")}</Label>
      <Input placeholder={t("form.email.placeholder")} />
    </form>
  );
};
```

### Type Safety Implementation

**Translation Key Types**

```typescript
// Auto-generated from translation files
type TranslationKeys =
  | "dashboard.header.title"
  | "dashboard.stats.totalClients"
  | "common.actions.create"
  | "auth.form.email.label";

// Type-safe translation function
const t = (key: TranslationKeys, options?: TranslationOptions) => string;
```

## Data Models

### Translation File Schema

**JSON Structure**

```json
{
  "header": {
    "title": "Dashboard",
    "subtitle": "Benvenuto! Ecco cosa sta succedendo con la tua attività."
  },
  "stats": {
    "totalClients": "Clienti Totali",
    "itemsServices": "Articoli e Servizi",
    "totalDocuments": "Documenti Totali",
    "revenueThisMonth": "Ricavi di Questo Mese"
  },
  "actions": {
    "newDocument": "Nuovo Documento",
    "viewAll": "Visualizza Tutti"
  }
}
```

**Pluralization Support**

```json
{
  "documents": {
    "count_one": "{{count}} documento",
    "count_other": "{{count}} documenti"
  }
}
```

**Contextual Translations**

```json
{
  "status": {
    "paid_invoice": "Pagata",
    "paid_quote": "Accettata"
  }
}
```

### Configuration Models

**Language Configuration**

```typescript
interface LanguageConfig {
  code: "it" | "en";
  name: string;
  flag: string;
  dateFormat: string;
  numberFormat: Intl.NumberFormatOptions;
}

const italianConfig: LanguageConfig = {
  code: "it",
  name: "Italiano",
  flag: "🇮🇹",
  dateFormat: "dd/MM/yyyy",
  numberFormat: {
    style: "currency",
    currency: "EUR",
    locale: "it-IT",
  },
};
```

## Error Handling

### Translation Loading Errors

**Fallback Strategy**

1. Missing translation key → Show English fallback
2. Missing translation file → Load English namespace
3. Network error during load → Use cached translations
4. Invalid JSON → Log error and continue with available translations

**Error Boundary Integration**

```typescript
const TranslationErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<div>Translation system unavailable</div>}
      onError={(error) => console.error("Translation error:", error)}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### Runtime Error Handling

**Missing Key Detection**

```typescript
const useTranslation = (namespace: string) => {
  const t = (key: string, options?: TranslationOptions) => {
    const translation = i18n.t(`${namespace}:${key}`, options);

    // Log missing translations in development
    if (process.env.NODE_ENV === "development" && translation === key) {
      console.warn(`Missing translation: ${namespace}:${key}`);
    }

    return translation;
  };

  return { t };
};
```

## Testing Strategy

### Translation Coverage Testing

**Automated Key Extraction**

- Script to scan React components for hardcoded strings
- Validation that all extracted strings have corresponding translation keys
- CI/CD integration to prevent untranslated strings from reaching production

**Translation Completeness**

```typescript
// Test to ensure all English keys have Italian translations
describe("Translation Completeness", () => {
  it("should have Italian translations for all English keys", () => {
    const englishKeys = extractKeysFromJSON(englishTranslations);
    const italianKeys = extractKeysFromJSON(italianTranslations);

    expect(italianKeys).toEqual(expect.arrayContaining(englishKeys));
  });
});
```

### Component Integration Testing

**Translation Hook Testing**

```typescript
describe("useTranslation Hook", () => {
  it("should return Italian translations", () => {
    const { result } = renderHook(() => useTranslation("common"));
    expect(result.current.t("actions.create")).toBe("Crea");
  });

  it("should fallback to English for missing keys", () => {
    const { result } = renderHook(() => useTranslation("common"));
    expect(result.current.t("missing.key")).toBe("Create"); // English fallback
  });
});
```

### Visual Regression Testing

**Layout Validation**

- Automated screenshots comparing English vs Italian layouts
- Text overflow detection for longer Italian translations
- Button and form field sizing validation
- Mobile responsive layout testing with Italian text

## Implementation Phases

### Phase 1: Foundation Setup

- Install and configure react-i18next
- Create translation file structure
- Implement I18nProvider and useTranslation hook
- Set up type safety infrastructure

### Phase 2: Core Pages Translation

- Authentication pages (Login, Register)
- Dashboard page with all statistics and quick actions
- Navigation and common UI elements

### Phase 3: Feature Pages Translation

- Documents page with all table headers and filters
- Clients page with form fields and actions
- Items page with management interface

### Phase 4: Forms and Validation

- All form labels and placeholders
- Validation error messages
- Toast notifications and user feedback

### Phase 5: Polish and Testing

- Date and number formatting
- Pluralization rules
- Comprehensive testing
- Performance optimization
