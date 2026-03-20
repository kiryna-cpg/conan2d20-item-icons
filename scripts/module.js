import { MODULE_ID, SETTING_KEYS, SYSTEM_ID } from "./constants.js";
import { ensureIconOverridesLoaded, getIconOverrideStats } from "./icon-overrides.js";
import { resolveIconAssignment } from "./icon-resolver.js";
import { applyIconToPendingItem, runIconMigration, shouldApplyOnCreate } from "./migration.js";
import { resetIconsToSystemDefault } from "./reset-icons.js";
import { registerSettings } from "./settings.js";

function isConanSystem() {
  return game.system?.id === SYSTEM_ID;
}

function registerApi() {
  const module = game.modules.get(MODULE_ID);
  if (!module) return;

  module.api = {
    resolveIconAssignment,
    runIconMigration,
    resetIconsToSystemDefault,
    ensureIconOverridesLoaded,
    getIconOverrideStats,
    async reloadIconOverrides() {
      return ensureIconOverridesLoaded({ force: true });
    },
    async runMigrationFromApi({ overwriteCustomIcons = false } = {}) {
      return runIconMigration({ overwriteCustomIcons });
    },
    async resetIconsFromApi({ types = [] } = {}) {
      return resetIconsToSystemDefault({ types });
    }
  };
}

function registerCreateHooks() {
  const sourceImageCache = new Map();

  Hooks.on("preCreateItem", async (item, data, _options, userId) => {
    if (!isConanSystem()) return;
    if (userId !== game.user?.id) return;
    if (!game.settings.get(MODULE_ID, SETTING_KEYS.AUTO_ASSIGN_ON_CREATE)) return;

    // Keep create/import resolution stable. The latest overrides should be loaded
    // during ready or explicitly refreshed by migration/reload.
    await ensureIconOverridesLoaded();

    const assignment = resolveIconAssignment(item, data);
    if (!assignment) return;
    if (!(await shouldApplyOnCreate(item, data, { sourceImageCache }))) return;

    applyIconToPendingItem(item, assignment);
  });
}

Hooks.once("init", () => {
  registerSettings();
  registerApi();
  registerCreateHooks();
});

Hooks.once("ready", async () => {
  if (!isConanSystem()) return;

  await ensureIconOverridesLoaded();
  const stats = getIconOverrideStats();
  console.info(`[${MODULE_ID}] ready`, stats);
});
