# Ayu Project Rules

## Deployment & Updates (EAS Update First)

- Always prefer `eas update` over `eas build` for any change that OTA updates support.
- Changes supported by `eas update` (do NOT run `eas build` for these):
  - Web app UI, React components, styles, and logic in `src/**` and `index.html`
  - Regenerated WebView bundle (`bundleHtml.js`)
  - React Native JS wrapper (`App.native.js`, `index.js`) and pure-JS dependencies
  - Bundled JS assets
- Required update workflow for JS/UI changes:
  1. Run `npm run build` (rebuilds Vite `dist/` and regenerates `bundleHtml.js`).
  2. Run `npm run eas:update:preview` (or `npm run eas:update:production` when targeting production).
- Only run `eas build` when native changes require a new binary:
  - Adding, removing, or upgrading native dependencies (including `expo-*` native modules)
  - Changing native `app.json` fields (`permissions`, `icon`, `splash`, `bundleIdentifier`, `android.package`, `plugins`, or `version`/`runtimeVersion`)
