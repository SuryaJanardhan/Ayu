# Ayu

Ayu is a local-only, privacy-first personal health and fitness telemetry mobile application.

## Core Features

* **Local-Only & Private**: All data is stored in an embedded on-device SQLite database. One-tap export and import of the entire database file for seamless backup.
* **Modular Dashboard**: Dedicated cards for Nutrition, Workouts, Biometrics, and Sleep with instant drill-down.
* **Deterministic Nutrition Ingestion**:
  * Exact-phrase matching: Previously logged meal phrases (e.g., "2 eggs on sourdough toast") resolve immediately from local cache with zero latency and zero API calls.
  * AI-powered fallback: Unseen phrases parse via user's Gemini API key and save directly into the local cache for future deterministic reuse.
  * Fixed targets with daily override: User sets baseline targets with the ability to override numbers for specific days (e.g., refeed or rest days).
* **Workouts with Memory**:
  * Template-based routine system (Push, Pull, Legs, Running, etc.).
  * Automatically pre-fills weights and reps from the previous session for fast micro-adjustments.
* **Biometric Synchronization**:
  * Passive sync from Apple HealthKit and Google Health Connect for steps, sleep, and background calories.
  * Explicit manual override priority: Manual entries always take precedence over phone hardware data.
  * 7-day exponential moving average for body weight trend smoothing.

## Technology Stack

* **Framework**: React Native with Expo and TypeScript
* **Styling**: NativeWind (Tailwind CSS)
* **Local Database**: Expo SQLite with Drizzle ORM
* **Storage & Keys**: MMKV and Expo SecureStore
* **Health Integrations**: Apple HealthKit / Google Health Connect
