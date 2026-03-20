import { getDynamicNameIcons, getDynamicSourceIcons } from "./icon-overrides.js";

/**
 * Exact source-id overrides baked into the module.
 *
 * Large per-item mappings should live in data/icon-overrides.json.
 */
export const BUILTIN_EXACT_SOURCE_ICONS = Object.freeze({});

/**
 * Exact normalized-name overrides baked into the module.
 *
 * Keep this table intentionally small. Prefer source-id overrides in JSON.
 */
export const BUILTIN_EXACT_NAME_ICONS = Object.freeze({});

export function getExactSourceIcons() {
  return {
    ...BUILTIN_EXACT_SOURCE_ICONS,
    ...getDynamicSourceIcons()
  };
}

export function getExactNameIcons() {
  return {
    ...BUILTIN_EXACT_NAME_ICONS,
    ...getDynamicNameIcons()
  };
}