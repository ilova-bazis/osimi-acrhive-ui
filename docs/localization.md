# Localization

## Supported UI locales

The interface supports two UI locales:

| Locale | Dictionary key |
| --- | --- |
| English | `en` |
| Russian | `ru` |

The UI locale controls interface text only. Archival content languages (Persian, Tajik, Russian, English, and mixed content) are object metadata and are managed separately through object filters and ingestion fields.

## Architecture

- Dictionaries: `src/lib/i18n/translations.ts`. Every supported locale exposes a top-level key; `LocaleKey` is inferred from those keys. `TranslationKey` is derived from the English leaf paths and typed lookup is enforced at compile time.
- Locale store: `src/lib/i18n/locale.ts`. Holds the active locale, persists it, and synchronizes `<html lang>`.
- Helpers: `src/lib/i18n/translate.ts` provides safe own-property dot-path lookup (`translate` for static keys, `translateDynamic` for open values) and `{placeholder}` template substitution. `src/lib/i18n/format.ts` provides locale-aware UTC timestamps, counts, and byte sizes.
- Shared shell navigation: `src/lib/navigation/appShell.ts` defines the desktop/mobile destinations and route matching; `labelKey` is a typed `TranslationKey`.
- Selection UI: `src/lib/components/LocaleSwitcher.svelte`, consumed by `AppSidebar` (desktop), `AppMobileHeader` (mobile), and the login page.

## Persistence and initialization

- Storage key: `osimi-locale` in `localStorage`.
- Default locale: `en` when no preference has been saved.
- `locale.setLocale()` updates the store immediately, then synchronizes `document.documentElement.lang` and persistence.
- `locale.init()` runs once in the root layout `onMount`. It restores valid saved values and resets missing or invalid values to English.
- Only **own** top-level dictionary keys are valid locales. Inherited property names such as `constructor`, `toString`, and `__proto__` are rejected during initialization.
- Storage failures are contained: an inaccessible `localStorage` never blocks the in-memory locale, document language, or layout mounting.

## Dictionary and formatting guarantees

- `src/lib/i18n/translations.spec.ts` enforces structural parity across locales: identical leaf paths, string-only leaves, plain-object intermediates, matching placeholder names and counts, no empty values, and no `.` in property names. The English leaf count is snapshotted as a growth alarm.
- `src/lib/i18n/translate.spec.ts` covers lookup failure behavior, prototype-key rejection, dynamic fallbacks, and compile-time `TranslationKey` assertions.
- Timestamps render with `dateStyle: 'medium'`, `timeStyle: 'short'`, and `timeZone: 'UTC'` so server and browser output is identical; invalid values render `values.unknown`.
- Byte sizes and counts use `Intl.NumberFormat` for the active locale, including sub-1024 bytes. File-size units extend from B through TB/PB.
- Plurals use `Intl.PluralRules($locale)`; Russian `one`/`few`/`many`/`other` forms are provided where templates exist. Plural families live across dashboard, ingestion, objects, and object editing.
- `formatPlural()` takes a plural base as a string and casts the resolved path to `TranslationKey`, so it is less compile-time-safe than static `translate()` lookups. Plural bases are covered by focused tests and the smoke unresolved-placeholder checks.

## Status and enum handling

- Stable client-known enums (availability/processing/curation states, access reasons and levels, request statuses/actions, media types, object types, item kinds, classification types, pipeline presets, known language codes) are localized through exhaustive typed maps in `src/lib/i18n/domainLabels.ts`.
- Known subsets of open backend values use typed `knownXKey()` guards that return `TranslationKey | null`; callers render the original raw value when the guard returns `null`.
- Ingestion batch/file/item statuses are normalized per domain in `src/lib/i18n/statusLabels.ts` before translation; unknown status values render raw.
- Dashboard role copy and known activity events are converted through typed mapper codes, never raw string concatenation.
- `translateDynamic()` has no production callers — it is retained only as a generic helper for potential future open-key use. See `docs/translate-dynamic-inventory.md`.

## Server-originated copy

- Application-owned server messages never ship English sentences to the page. Load/action errors return stable structured codes (`{ code: 'loadFailed', requestId }`, `errorCode`, `messageCode`) that the page translates with typed keys and `{requestId}` templates.
- The new-ingestion default batch label is generated in the submitting client's locale through a hidden `locale` form field; genuinely backend-provided error text renders raw only where no stable contract exists (setup/review action errors, publication `failureReason`).
- SvelteKit `throw error(...)` error pages are developer-facing and outside the localized surface.

## Selector options

`LocaleSwitcher` derives its options from the top-level translation dictionary keys, so adding a new locale dictionary automatically adds a selector control. Option labels are the uppercase locale codes (`EN`, `RU`).

## Login error localization

Login actions return stable error codes (`invalidOrigin`, `credentialsRequired`, `invalidCredentials`, `loginFailed`) defined in `src/lib/auth/loginErrors.ts`, never backend-controlled or internal error text. The login page maps codes through `login.errors.*` translation keys, so errors render in the active locale and retranslate when the locale changes. Errors are exposed with `role="alert"`, `aria-live="assertive"`, and input association via `aria-invalid` and `aria-describedby`.

## Dialogs

Modal confirmations use the shared `BaseDialog` component (`src/lib/components/BaseDialog.svelte`) which provides `role="dialog"`, `aria-modal`, `aria-labelledby`, initial focus, Escape close, Tab containment, click-outside close, and focus restoration. The resync confirmation and publish dialog reuse it.

## Authenticated shell scrolling

- Below `lg`: the authenticated shell owns the dynamic viewport height. `AppMobileHeader` sits outside a single route scrollport that owns vertical scrolling. Route-local `sticky top-0` headers stick inside that scrollport directly below the mobile header; no header height is measured or hard-coded.
- On mobile route changes, the route scrollport resets to the top; browser back/forward navigation restores the previously recorded position.
- At `lg` and above: the document owns scrolling, the desktop sidebar grid applies, and `AppMobileHeader` is hidden.

## Known limitations

- Persistence is client-only. SSR emits English, `app.html` starts with `lang="en"`, and a saved Russian locale is applied after hydration.
- The preference is per browser/device on the current origin, not per user account, and does not synchronize between devices.
- Changing the locale does not reload the page or trigger a backend request.
- Dynamic backend-provided labels without stable code contracts remain untranslated and are documented in `docs/translation-coverage.md`.
- `en` and `ru` are left-to-right, so no `dir` handling is implemented.

Explicitly out of scope:

- Locale cookies and server-negotiated locale (`Accept-Language`, locale-prefixed URLs, account-level preferences).
- Server-rendering the persisted client locale.
- A third-party localization framework; the custom dictionary and helpers are intentionally minimal.

## Adding or changing translations

1. Add the key to every top-level locale in `src/lib/i18n/translations.ts` with the same nested structure. The parity tests fail on any mismatch and report the exact missing/extra paths. Update the leaf-count growth alarm in `translations.spec.ts` to the new exact count.
2. Consume static strings through `translate()` with a `$derived` dictionary based on `$locale`.
   - Stable client-known values use exhaustive typed mappings (see `src/lib/i18n/domainLabels.ts`); known subsets of open backend values use typed `knownXKey()` guards that return a `TranslationKey | null`, with the original raw value as the visible fallback.
   - `translateDynamic()` has no production callers — it is retained only as a generic helper.
3. Keep dynamic data (usernames, batch names, counts, backend-provided open values) out of the dictionaries; genuinely unknown external values render raw.
4. UI tests that assert translated text should restore `locale.setLocale('en')` in `afterEach`/`finally`.
5. Adding a new top-level locale dictionary automatically exposes a selector option; add its translations completely before shipping.

## Placeholder grammar

Placeholders follow the exact grammar below and are validated by
`src/lib/i18n/translationValidation.ts` (see `validateTranslationDictionaries`):

- A placeholder is `{name}` where `name` matches `^[A-Za-z_][A-Za-z0-9_]*$`.
- Braces must be balanced; an unmatched `{` or `}` is rejected.
- Whitespace inside braces is rejected (`{ name}` and `{name }` fail).
- Nested or doubled braces are rejected; literal braces are unsupported and there is no escape syntax (`{{name}}` fails).
- Duplicate placeholders within one dictionary template are rejected (`{count} of {count}` fails); the generic `formatTemplate()` still supports repeated tokens for non-dictionary callers.
- Diagnostics report the locale, exact key path, offending token, and index.

Placeholder parity between locales compares sorted `[name, count]` tuples, so a valid
reordering such as `{first} {second}` versus `{second} {first}` passes while
rename/add/remove/count changes fail.

## Runtime formatting

`formatTemplate(template, values)` parses templates with the same strict grammar:

- Valid placeholders interpolate own supplied values once.
- Missing values leave the token visible.
- Extra supplied values are ignored.
- Replacement values are never recursively interpolated.
- Templates containing any malformed or unmatched brace are returned unchanged so defects stay visible instead of being partially rendered.

The authenticated production smoke (`scripts/smoke-auth.mjs`) fails any covered route
or interaction that renders an unresolved `{identifier}` token.

## Testing boundaries

- Browser/component tests must use `.svelte.spec.ts` naming to run in the Vitest `client` project (Playwright Chromium).
- Non-Svelte logic (locale store, navigation helpers, dictionaries, translation and formatting helpers) uses `.spec.ts` naming and runs in the Node `server` project.
- `src/lib/i18n/locale.ts` must remain import-safe on the server; `locale.init()` and store updates never access `window`, `document`, or `localStorage` outside the browser.
- Responsive shell geometry (scrollport bounds, sticky-header placement) is covered by `src/routes/layout.svelte.spec.ts` at mobile and desktop viewports.
