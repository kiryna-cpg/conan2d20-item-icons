# Conan 2d20 - Item Icons

A lightweight Foundry VTT v13 module for **Robert E. Howard’s Conan: Adventures in an Age Undreamed Of**.

It assigns clearer icons to Conan 2d20 items using exact overrides from `data/icon-overrides.json`, while keeping the Conan system’s own default icons whenever no override exists.

## What it does

- Auto-assigns item icons on **create/import** when an exact override exists.
- Applies exact icon overrides from `data/icon-overrides.json`.
- Provides a manual **Open Migration Dialog** workflow for existing items.
- Lets you choose:
  - which **item types** to migrate
  - whether to **overwrite custom icons**
- Provides a manual **Open Reset Dialog** workflow to restore Conan system default icons.
- Supports:
  - world items
  - actor embedded items
  - Conan NPC attack entries (`npcattack`)
  - unlinked token items
- Works in **English** and **Spanish**.

## Typical workflow

1. Edit `data/icon-overrides.json`.
2. **Reload Application**.
3. Open **Module Settings**.
4. Use **Open Migration Dialog**.
5. Select the item types you want to migrate.
6. Enable **Overwrite custom icons during migration** only if you want to replace non-generic artwork.
7. Run the migration.

## Requirements

- **Foundry VTT**: `13.351`
- **Conan 2d20 system**: `2.4.3`

## Installation

1. Foundry → **Add-on Modules** → **Install Module**
2. Paste this manifest URL:

   `https://raw.githubusercontent.com/kiryna-cpg/conan2d20-item-icons/main/module.json`

3. Install the module.
4. Enable **Conan 2d20 - Item Icons** in your world.
5. **Reload Application**.

## Configuration

World Settings → **Conan 2d20 - Item Icons**

Available controls:

- **Auto-assign Conan item icons on create/import**
- **Open Migration Dialog**
- **Open Reset Dialog**

## JSON override source of truth

The module reads exact icon overrides from:

`data/icon-overrides.json`

Recommended fields per row:

- `sourceId`
- `pack`
- `id`
- `name`
- `type`
- `currentImg`
- `icon`
- `notes`

The resolver prefers:

1. exact `sourceId` matches
2. exact normalized `name` matches

If no exact override exists, the item keeps the Conan system default icon.

## Notes

- After editing `data/icon-overrides.json`, use **Reload Application** before running the migration.
- Manual migration only changes item types selected in the migration dialog.
- Reset restores Conan system default icons by selected type.
- The module does **not** modify Conan compendia directly; it applies overrides to created/imported and migrated items.

## Support

- Issues: `https://github.com/kiryna-cpg/conan2d20-item-icons/issues`
- Repo: `https://github.com/kiryna-cpg/conan2d20-item-icons`

## License

MIT. See `LICENSE`.