import { FLAG_KEYS, MODULE_ID } from "./constants.js";
import { ensureIconOverridesLoaded } from "./icon-overrides.js";
import {
  getSourceId,
  hasCustomImage,
  isKnownGenericImage,
  isModuleAssigned,
  resolveIconAssignment
} from "./icon-resolver.js";

function buildFlagData(assignment) {
  return {
    [MODULE_ID]: {
      [FLAG_KEYS.AUTO_ASSIGNED]: true,
      [FLAG_KEYS.ICON_KEY]: assignment.iconKey ?? null,
      [FLAG_KEYS.RESOLVER]: assignment.resolver ?? null,
      [FLAG_KEYS.SOURCE_ID]: assignment.sourceId ?? null,
      [FLAG_KEYS.APPLIED_PATH]: assignment.path ?? null
    }
  };
}

function isModuleIconPath(img) {
  const value = String(img ?? "").trim().toLowerCase();
  if (!value) return false;
  return value.startsWith(`modules/${MODULE_ID}/icons/`);
}

function getLastAppliedPath(item) {
  return String(item?.getFlag?.(MODULE_ID, FLAG_KEYS.APPLIED_PATH) ?? "").trim();
}

function getLastResolver(item) {
  return String(item?.getFlag?.(MODULE_ID, FLAG_KEYS.RESOLVER) ?? "").trim();
}

function getMigrationType(item) {
  const itemType = String(item?.type ?? "").toLowerCase();

  if (itemType !== "npcattack") return itemType;

  const attackType = String(item?.system?.attackType ?? "").toLowerCase();

  if (attackType === "threaten") return "display";
  if (attackType === "melee" || attackType === "ranged") return "weapon";

  return "weapon";
}

function shouldMigrateItemType(item, selectedTypes) {
  if (!selectedTypes?.size) return true;
  return selectedTypes.has(getMigrationType(item));
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

async function isSafeSourceImage(item, currentImage, { sourceImageCache } = {}) {
  const sourceId = getSourceId(item);
  if (!sourceId) return false;

  const sourceImage = await getCompendiumSourceImage(sourceId, sourceImageCache ?? new Map());
  if (!sourceImage) return false;

  return String(currentImage ?? "").trim() === sourceImage;
}

async function shouldUpdateExistingItem(item, assignment, { overwriteCustomIcons = false, sourceImageCache } = {}) {
  if (!item || !assignment?.path) return false;
  if (overwriteCustomIcons) return true;

  const currentImage = String(item.img ?? "").trim();
  if (!currentImage) return true;
  if (isKnownGenericImage(currentImage)) return true;
  if (isModuleIconPath(currentImage)) return true;

  const lastAppliedPath = getLastAppliedPath(item);
  if (lastAppliedPath && currentImage === lastAppliedPath) return true;

  if (isModuleAssigned(item, MODULE_ID)) {
    const lastResolver = getLastResolver(item);

    // Backward-compatibility for items migrated by older versions of the module.
    // Those versions stored resolver/sourceId but not the exact applied path, so
    // exact JSON-based assignments later became indistinguishable from manual
    // custom icons. Treat those legacy exact matches as module-managed so they
    // can be refreshed once.
    if (!lastAppliedPath && (lastResolver === "exactSource" || lastResolver === "exactName")) {
      return true;
    }

    // If the item was previously auto-assigned by the module, but the current
    // image no longer matches the last path applied by the module, preserve it
    // as a manual override unless overwrite is enabled.
    return false;
  }

  if (await isSafeSourceImage(item, currentImage, { sourceImageCache })) return true;

  return !hasCustomImage(item, { moduleId: MODULE_ID, img: currentImage });
}

export async function shouldApplyOnCreate(item, data = null, { sourceImageCache } = {}) {
  const img = String(data?.img ?? item?.img ?? "").trim();

  if (!img) return true;
  if (isKnownGenericImage(img)) return true;
  if (isModuleIconPath(img)) return true;

  const sourceId = getSourceId(item, data);
  if (!sourceId) return false;

  const sourceImage = await getCompendiumSourceImage(sourceId, sourceImageCache ?? new Map());
  if (!sourceImage) return false;

  return img === sourceImage;
}

export function applyIconToPendingItem(item, assignment) {
  if (!item || !assignment?.path) return false;

  item.updateSource({
    img: assignment.path,
    flags: buildFlagData(assignment)
  });

  return true;
}

function buildItemUpdate(item, assignment) {
  if (!assignment?.path) return null;
  if (String(item.img ?? "") === String(assignment.path)) {
    return {
      _id: item.id,
      flags: buildFlagData(assignment)
    };
  }

  return {
    _id: item.id,
    img: assignment.path,
    flags: buildFlagData(assignment)
  };
}

export async function runIconMigration({ overwriteCustomIcons = false, types = [] } = {}) {
  await ensureIconOverridesLoaded();

  const selectedTypes = new Set(
    types.map((type) => String(type ?? "").toLowerCase().trim()).filter(Boolean)
  );

  const result = {
    worldItemsUpdated: 0,
    actorItemsUpdated: 0,
    actorsTouched: 0
  };

  const sourceImageCache = new Map();
  const worldUpdates = [];
  for (const item of game.items.contents) {
    if (!shouldMigrateItemType(item, selectedTypes)) continue;

    const assignment = resolveIconAssignment(item);
    if (!assignment) continue;
    if (!(await shouldUpdateExistingItem(item, assignment, { overwriteCustomIcons, sourceImageCache }))) continue;
    const update = buildItemUpdate(item, assignment);
    if (update) worldUpdates.push(update);
  }

  if (worldUpdates.length) {
    await Item.updateDocuments(worldUpdates);
    result.worldItemsUpdated = worldUpdates.length;
  }

  for (const actor of game.actors.contents) {
    const embeddedUpdates = [];

    for (const item of actor.items.contents) {
      if (!shouldMigrateItemType(item, selectedTypes)) continue;

      const assignment = resolveIconAssignment(item);
      if (!assignment) continue;
      if (!(await shouldUpdateExistingItem(item, assignment, { overwriteCustomIcons, sourceImageCache }))) continue;

      const update = buildItemUpdate(item, assignment);
      if (update) embeddedUpdates.push(update);
    }

    if (!embeddedUpdates.length) continue;

    await actor.updateEmbeddedDocuments("Item", embeddedUpdates);
    result.actorsTouched += 1;
    result.actorItemsUpdated += embeddedUpdates.length;
  }

  return result;
}