import { FLAG_KEYS, MODULE_ID } from "./constants.js";
import { getExactNameIcons, getExactSourceIcons } from "./icon-registry.js";

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function getSourceId(item, data = null) {
  return (
    data?._stats?.compendiumSource ??
    item?._stats?.compendiumSource ??
    data?.flags?.core?.sourceId ??
    item?.flags?.core?.sourceId ??
    data?.flags?.[MODULE_ID]?.[FLAG_KEYS.SOURCE_ID] ??
    item?.getFlag?.(MODULE_ID, FLAG_KEYS.SOURCE_ID) ??
    null
  );
}

export function isKnownGenericImage(img) {
  const value = String(img ?? "")
    .trim()
    .toLowerCase()
    .replace(/\\/g, "/");

  if (!value) return true;

  if (value.startsWith("icons/svg/")) return true;

  // Conan 2d20 stock compendium placeholders should be treated as generic.
  if (value.startsWith("systems/conan2d20/assets/icons/compendiums/")) return true;

  const genericBasenames = new Set([
    "book.svg",
    "chest.svg",
    "cube.svg",
    "dagger.svg",
    "item-bag.svg",
    "shield.svg",
    "sword.svg",
    "upgrade.svg",
    "icon-action-free.png",
    "icon-action-minor.png",
    "icon-action-reaction.png",
    "icon-action-standard.png",
    "icon-armor.png",
    "icon-display-power.png",
    "icon-enchantment.png",
    "icon-spells.png",
    "icon-talent-books.png",
    "icon-tools.png",
    "icon-weapon.png"
  ]);

  const base = value.split("/").pop() ?? value;
  return genericBasenames.has(base);
}

export function isModuleAssigned(item, moduleId) {
  return item?.getFlag?.(moduleId, FLAG_KEYS.AUTO_ASSIGNED) === true;
}

export function hasCustomImage(item, { moduleId, img = null } = {}) {
  const current = String(img ?? item?.img ?? "")
    .trim()
    .replace(/\\/g, "/");

  if (!current) return false;
  if (isKnownGenericImage(current)) return false;

  if (moduleId) {
    const moduleBase = `modules/${moduleId}/icons/`.toLowerCase();
    if (current.toLowerCase().startsWith(moduleBase)) return false;
    if (isModuleAssigned(item, moduleId)) return false;
  }

  return true;
}

export function resolveIconAssignment(item, data = null) {
  const name = normalizeText(data?.name ?? item?.name ?? "");
  const sourceId = getSourceId(item, data);
  const sourceKey = String(sourceId ?? "").trim();

  const exactSourceIcons = getExactSourceIcons();
  if (sourceKey && exactSourceIcons[sourceKey]) {
    return {
      path: exactSourceIcons[sourceKey],
      iconKey: `source:${sourceKey}`,
      resolver: "exactSource",
      sourceId: sourceKey
    };
  }

  const exactNameIcons = getExactNameIcons();
  if (name && exactNameIcons[name]) {
    return {
      path: exactNameIcons[name],
      iconKey: `name:${name}`,
      resolver: "exactName",
      sourceId: sourceKey || null
    };
  }

  return null;
}