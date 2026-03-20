import { FLAG_KEYS, MODULE_ID } from "./constants.js";
import { ensureIconOverridesLoaded } from "./icon-overrides.js";
import { isModuleAssigned, resolveIconAssignment } from "./icon-resolver.js";

export const RESETTABLE_ITEM_TYPES = Object.freeze([
  { key: "weapon", label: "C2I.ResetDialog.Type.Weapon" },
  { key: "armor", label: "C2I.ResetDialog.Type.Armor" },
  { key: "consumable", label: "C2I.ResetDialog.Type.Consumable" },
  { key: "display", label: "C2I.ResetDialog.Type.Display" },
  { key: "enchantment", label: "C2I.ResetDialog.Type.Enchantment" },
  { key: "kit", label: "C2I.ResetDialog.Type.Kit" },
  { key: "miscellaneous", label: "C2I.ResetDialog.Type.Miscellaneous" },
  { key: "spell", label: "C2I.ResetDialog.Type.Spell" },
  { key: "talent", label: "C2I.ResetDialog.Type.Talent" }
]);

const SYSTEM_DEFAULT_TYPE_ICONS = Object.freeze({
  armor: "systems/conan2d20/assets/icons/compendiums/icon-armor.png",
  consumable: "systems/conan2d20/assets/icons/compendiums/icon-tools.png",
  display: "systems/conan2d20/assets/icons/compendiums/icon-display-power.png",
  enchantment: "systems/conan2d20/assets/icons/compendiums/icon-enchantment.png",
  kit: "systems/conan2d20/assets/icons/compendiums/icon-tools.png",
  miscellaneous: "systems/conan2d20/assets/icons/compendiums/icon-tools.png",
  spell: "systems/conan2d20/assets/icons/compendiums/icon-spells.png",
  talent: "systems/conan2d20/assets/icons/compendiums/icon-talent-books.png",
  weapon: "systems/conan2d20/assets/icons/compendiums/icon-weapon.png"
});

function getResetType(item) {
  const itemType = String(item?.type ?? "").toLowerCase();

  if (itemType !== "npcattack") return itemType;

  const attackType = String(item?.system?.attackType ?? "").toLowerCase();

  if (attackType === "threaten") return "display";
  if (attackType === "melee" || attackType === "ranged") return "weapon";

  return "weapon";
}

function isModuleIconPath(img) {
  const value = String(img ?? "").trim().toLowerCase().replace(/\\/g, "/");
  if (!value) return false;
  return value.startsWith(`modules/${MODULE_ID}/icons/`);
}

function normalizePath(value) {
  return String(value ?? "").trim().replace(/\\/g, "/").toLowerCase();
}

function isCurrentResolvedOverride(item) {
  const assignment = resolveIconAssignment(item);
  if (!assignment?.path) return false;

  return normalizePath(item?.img) === normalizePath(assignment.path);
}

function hasManagedModuleState(item) {
  return (
    isModuleAssigned(item, MODULE_ID) ||
    !!item?.getFlag?.(MODULE_ID, FLAG_KEYS.APPLIED_PATH) ||
    !!item?.getFlag?.(MODULE_ID, FLAG_KEYS.RESOLVER) ||
    !!item?.getFlag?.(MODULE_ID, FLAG_KEYS.SOURCE_ID) ||
    isModuleIconPath(item?.img) ||
    isCurrentResolvedOverride(item)
  );
}

async function getCompendiumSourceImage(sourceId, cache) {
  if (!sourceId) return null;
  if (cache.has(sourceId)) return cache.get(sourceId);

  let imagePath = null;

  try {
    const sourceDocument = await fromUuid(sourceId);
    imagePath = String(sourceDocument?.img ?? "").trim() || null;
  } catch (error) {
    console.warn(`[${MODULE_ID}] failed to resolve compendium source for ${sourceId}`, error);
  }

  cache.set(sourceId, imagePath);
  return imagePath;
}

function getSystemCompendiumSourceId(item) {
  const sourceId = String(
    item?._stats?.compendiumSource ??
    item?.flags?.core?.sourceId ??
    ""
  ).trim();

  if (!sourceId.startsWith("Compendium.")) return null;
  return sourceId;
}

async function resolveSystemDefaultImage(item, sourceImageCache) {
  // Important: when resetting, only trust the document's real compendium source.
  // Do not use this module's stored sourceId flag, because that can survive prior
  // migrations/import flows and force a second reset pass before the item falls
  // back to the Conan system default icon.
  const sourceId = getSystemCompendiumSourceId(item);

  if (sourceId) {
    const sourceImage = await getCompendiumSourceImage(sourceId, sourceImageCache);
    if (sourceImage) return sourceImage;
  }

  const resetType = getResetType(item);
  return SYSTEM_DEFAULT_TYPE_ICONS[resetType] ?? null;
}

function buildResetUpdate(item, targetImage) {
  const update = { _id: item.id };

  if (String(item.img ?? "").trim() !== String(targetImage ?? "").trim()) {
    update.img = targetImage;
  }

  return update;
}

function buildResetFlagClearUpdate(itemOrUpdate) {
  const id = itemOrUpdate?._id ?? itemOrUpdate?.id;
  return {
    _id: id,
    [`flags.-=${MODULE_ID}`]: null
  };
}

function shouldResetItem(item, selectedTypes) {
  const resetType = getResetType(item);
  if (!selectedTypes.has(resetType)) return false;

  // Reset every selected item type back to Conan system defaults.
  // This intentionally applies to world items, actor embedded items,
  // and unlinked token embedded items regardless of module flags.
  return true;
}

async function collectResetUpdates(items, selectedTypes, sourceImageCache, result) {
  const updates = [];

  for (const item of items) {
    if (!shouldResetItem(item, selectedTypes)) continue;

    const targetImage = await resolveSystemDefaultImage(item, sourceImageCache);
    if (!targetImage) {
      result.unresolved += 1;
      continue;
    }

    updates.push(buildResetUpdate(item, targetImage));
  }

  return updates;
}

async function resetActorItems(actor, selectedTypes, sourceImageCache, result) {
  const embeddedUpdates = await collectResetUpdates(
    actor.items.contents,
    selectedTypes,
    sourceImageCache,
    result
  );

  if (!embeddedUpdates.length) return;

  await actor.updateEmbeddedDocuments("Item", embeddedUpdates);
  await actor.updateEmbeddedDocuments("Item", embeddedUpdates.map(buildResetFlagClearUpdate));
  result.actorsTouched += 1;
  result.actorItemsUpdated += embeddedUpdates.length;
}

async function resetUnlinkedTokenItems(tokenDocument, selectedTypes, sourceImageCache, result) {
  if (!tokenDocument || tokenDocument.isLinked) return;

  const syntheticActor = tokenDocument.actor;
  if (!syntheticActor) return;

  const embeddedUpdates = await collectResetUpdates(
    syntheticActor.items.contents,
    selectedTypes,
    sourceImageCache,
    result
  );

  if (!embeddedUpdates.length) return;

  await Item.implementation.updateDocuments(embeddedUpdates, { parent: syntheticActor });
  await Item.implementation.updateDocuments(
    embeddedUpdates.map(buildResetFlagClearUpdate),
    { parent: syntheticActor }
  );
  result.actorsTouched += 1;
  result.actorItemsUpdated += embeddedUpdates.length;
}

export async function resetIconsToSystemDefault({ types = [] } = {}) {
  await ensureIconOverridesLoaded();

  const selectedTypes = new Set(
    types.map((type) => String(type ?? "").toLowerCase().trim()).filter(Boolean)
  );

  const result = {
    worldItemsUpdated: 0,
    actorItemsUpdated: 0,
    actorsTouched: 0,
    unresolved: 0
  };

  if (!selectedTypes.size) return result;

  const sourceImageCache = new Map();

  const worldUpdates = await collectResetUpdates(
    game.items.contents,
    selectedTypes,
    sourceImageCache,
    result
  );

  if (worldUpdates.length) {
    await Item.updateDocuments(worldUpdates);
    await Item.updateDocuments(worldUpdates.map(buildResetFlagClearUpdate));
    result.worldItemsUpdated = worldUpdates.length;
  }

  for (const actor of game.actors.contents) {
    await resetActorItems(actor, selectedTypes, sourceImageCache, result);
  }

  for (const scene of game.scenes.contents) {
    for (const tokenDocument of scene.tokens.contents) {
      await resetUnlinkedTokenItems(tokenDocument, selectedTypes, sourceImageCache, result);
    }
  }

  return result;
}