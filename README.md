# Conan 2d20 - Item Icons

A lightweight Foundry VTT v13 module that assigns clearer icons to Conan 2d20 items.

## What it does

- Auto-assigns icons to newly created or imported items.
- Runs a manual migration for existing world items and embedded actor items.
- Preserves custom icons by default.
- Keeps all icon selection rules in `scripts/icon-registry.js`.

## Extending the icon map

For best long-term results, add exact source-id mappings in:

- `scripts/icon-registry.js` -> `EXACT_SOURCE_ICONS`

Suggested source-id format:

```js
"Compendium.conan2d20.<packId>.<documentId>": ICONS.weaponSword
```

You can also add exact normalized names to `EXACT_NAME_ICONS`.
