# Conan 2d20 - Item Icons

Conan 2d20 - Item Icons assigns clearer icons to Conan 2d20 world items and actor-owned items.

It is a lightweight utility module: it does not change item rules, actor data, rolls, or system automation.

## v14 status

- Foundry VTT: **v14**
- Conan 2d20 system: **2.5.0**
- Languages: English and Spanish

## Main features

- Automatic icon assignment when Conan items are created or imported.
- One-click migration for existing world items.
- Actor-owned item migration support.
- Conservative defaults: existing custom icons are preserved unless the migration is allowed to update generic icons.

## Typical use

1. Enable the module.
2. Import or create Conan items normally.
3. Generic icons are replaced with clearer Conan-themed icons when a matching rule exists.
4. Run the migration from module settings to update existing items.

## Requirements

- Foundry VTT: `14`
- Conan 2d20 system: `2.5.0`

## Installation

Install with this manifest URL:

```txt
https://raw.githubusercontent.com/kiryna-cpg/conan2d20-item-icons/main/module.json
```

## Support

Report issues at:

```txt
https://github.com/kiryna-cpg/conan2d20-item-icons/issues
```

Include item type, item name, current icon path, expected icon behavior, Foundry version, and Conan system version.

## License

MIT.
