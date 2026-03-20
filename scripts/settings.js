import { MODULE_ID, SETTING_KEYS } from "./constants.js";
import { runIconMigration } from "./migration.js";
import { ResetIconsDialog } from "./reset-icons-dialog.js";

let suppressMigrationToggle = false;

async function handleRunMigrationSetting(value) {
  if (!value || suppressMigrationToggle) return;
  if (!game.user?.isGM) return;

  try {
    // Let the settings form finish persisting sibling values before reading them.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const overwriteCustomIcons = !!game.settings.get(MODULE_ID, SETTING_KEYS.OVERWRITE_CUSTOM_ICONS);
    const result = await runIconMigration({ overwriteCustomIcons });

    ui.notifications.info(
      game.i18n.format("C2I.Notification.MigrationComplete", {
        world: result.worldItemsUpdated,
        actorItems: result.actorItemsUpdated,
        actors: result.actorsTouched
      })
    );
  } catch (error) {
    console.error(`[${MODULE_ID}] migration failed`, error);
    ui.notifications.error(game.i18n.localize("C2I.Notification.MigrationFailed"));
  } finally {
    suppressMigrationToggle = true;
    await game.settings.set(MODULE_ID, SETTING_KEYS.RUN_MIGRATION_NOW, false);
    suppressMigrationToggle = false;
  }
}

export function registerSettings() {
  game.settings.register(MODULE_ID, SETTING_KEYS.AUTO_ASSIGN_ON_CREATE, {
    name: game.i18n.localize("C2I.Setting.AutoAssignOnCreate.Name"),
    hint: game.i18n.localize("C2I.Setting.AutoAssignOnCreate.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.OVERWRITE_CUSTOM_ICONS, {
    name: game.i18n.localize("C2I.Setting.OverwriteCustomIcons.Name"),
    hint: game.i18n.localize("C2I.Setting.OverwriteCustomIcons.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, SETTING_KEYS.RUN_MIGRATION_NOW, {
    name: game.i18n.localize("C2I.Setting.RunMigrationNow.Name"),
    hint: game.i18n.localize("C2I.Setting.RunMigrationNow.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: handleRunMigrationSetting
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