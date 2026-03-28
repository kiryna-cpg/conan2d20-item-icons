import { MODULE_ID, SETTING_KEYS } from "./constants.js";
import { MigrationIconsDialog } from "./migration-dialog.js";
import { ResetIconsDialog } from "./reset-icons-dialog.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, SETTING_KEYS.AUTO_ASSIGN_ON_CREATE, {
    name: game.i18n.localize("C2I.Setting.AutoAssignOnCreate.Name"),
    hint: game.i18n.localize("C2I.Setting.AutoAssignOnCreate.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.registerMenu(MODULE_ID, "runIconMigration", {
    name: game.i18n.localize("C2I.Menu.Migration.Name"),
    label: game.i18n.localize("C2I.Menu.Migration.Label"),
    hint: game.i18n.localize("C2I.Menu.Migration.Hint"),
    icon: "fa-solid fa-wand-magic-sparkles",
    type: MigrationIconsDialog,
    restricted: true
  });

  game.settings.registerMenu(MODULE_ID, "resetIconsToSystemDefault", {
    name: game.i18n.localize("C2I.Menu.ResetIcons.Name"),
    label: game.i18n.localize("C2I.Menu.ResetIcons.Label"),
    hint: game.i18n.localize("C2I.Menu.ResetIcons.Hint"),
    icon: "fa-solid fa-rotate-left",
    type: ResetIconsDialog,
    restricted: true
  });
}