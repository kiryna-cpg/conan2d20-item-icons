# Changelog

All notable changes to **Conan 2d20 - Item Icons** will be documented in this file.

## [0.5.0] - 2026-03-28

### Added
- Added a dedicated **Open Migration Dialog** settings submenu for manual icon migration.
- Added item-type selection to manual migration, matching the reset workflow.

### Changed
- Replaced the old **Run migration now + Save Changes** workflow with a dialog-driven migration flow.
- Moved **Overwrite custom icons during migration** from a persistent world setting into the migration dialog.
- Updated the README to follow the same general structure used in the other Foundry modules in this project.

### Removed
- Removed the old boolean migration trigger from Module Settings.

## [0.4.2] - 2026-03-21

### Fixed
- Fixed broken links.

## [0.4.1] - 2026-03-20

### Added
- Added install/update manifest metadata for Foundry VTT (`url`, `manifest`, `download`, `readme`, `changelog`, `bugs`).
- Added exact icon overrides from `data/icon-overrides.json`.
- Added a reset workflow to restore Conan system default icons by selected item types.
- Added support for reset and migration across world items, actor items, NPC items, and unlinked token items.
- Added support for Conan NPC attack entries by mapping `npcattack` records to logical `weapon` and `display` reset types.

### Changed
- Moved icon assignment logic to exact overrides only when no generic module fallback is desired.
- Improved import/create handling so items dragged from compendia use exact JSON overrides when present.
- Improved migration behavior so previously module-assigned icons can refresh correctly after override changes.
- Improved reset behavior so Conan system default icons resolve correctly on the first pass.

### Fixed
- Fixed deprecated Conan/Foundry source tracking usage by preferring modern compendium source data.
- Fixed migration behavior that could skip Conan stock placeholders or misidentify them as custom icons.
- Fixed reset behavior for embedded NPC items and unlinked token items.
- Fixed reset behavior for Conan `npcattack` records such as weapon and display attacks.
- Fixed override loading issues caused by malformed nested JSON arrays.

