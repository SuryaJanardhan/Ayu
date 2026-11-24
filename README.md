# Ayu

Ayu is a local-only, privacy-first personal health and fitness telemetry mobile application.

## Key Principles

* **Local-Only & Private**: All data is stored in an embedded on-device SQLite database. Zero external servers required.
* **Modular Dashboard**: Dedicated cards for Nutrition, Workouts, Biometrics, and Sleep with instant drill-down.
* **Smart Nutrition Intake**: Multimodal parsing (voice/photo via optional Gemini API key) with deterministic local caching. Repeated meals are resolved instantly from local storage.
* **Pragmatic Workouts**: Lightweight logging focusing on activity type, duration, and RPE, with set and rep tracking for strength sessions.
* **Biometric Synchronization**: Reads background metrics from native health systems (Apple HealthKit / Google Health Connect) with immediate manual override capabilities.

## Architecture

* **Framework**: React Native with Expo and TypeScript
* **Styling**: NativeWind (Tailwind CSS)
* **Local Database**: Expo SQLite with type-safe schema migrations
* **Key-Value Store**: MMKV / Expo SecureStore for fast config and API keys
* **Telemetry Sync**: Native HealthKit and Google Health Connect bridge
