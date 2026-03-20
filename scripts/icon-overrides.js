import { MODULE_ID } from "./constants.js";

const OVERRIDES_PATH = `modules/${MODULE_ID}/data/icon-overrides.json`;

const state = {
  loaded: false,
  loading: null,
  loadGeneration: 0,
  exactSourceIcons: Object.freeze({}),
  exactNameIcons: Object.freeze({}),
  stats: Object.freeze({
    rows: 0,
    exactSource: 0,
    exactName: 0,
    skipped: 0,
    path: OVERRIDES_PATH
  })
};

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function buildEmptyPayload() {
  return {
    exactSourceIcons: {},
    exactNameIcons: {},
    stats: {
      rows: 0,
      skipped: 0
    }
  };
}

function commitLoad({ exactSourceIcons, exactNameIcons, stats }) {
  state.exactSourceIcons = Object.freeze(exactSourceIcons);
  state.exactNameIcons = Object.freeze(exactNameIcons);
  state.stats = Object.freeze({
    rows: stats.rows,
    exactSource: Object.keys(exactSourceIcons).length,
    exactName: Object.keys(exactNameIcons).length,
    skipped: stats.skipped,
    path: OVERRIDES_PATH
  });
  state.loaded = true;
  return state;
}

function coerceRows(payload) {
  const candidate = Array.isArray(payload) ? payload : payload?.rows;
  if (!Array.isArray(candidate)) return null;

  // Accept the common mistake of wrapping the scaffold in an extra top-level array.
  if (candidate.length === 1 && Array.isArray(candidate[0])) {
    console.warn(`[${MODULE_ID}] icon overrides JSON is wrapped in an extra top-level array. Unwrapping payload.`);
    return candidate[0];
  }

  return candidate.flatMap((row) => (Array.isArray(row) ? row : [row]));
}

function parseOverrides(payload) {
  const rows = coerceRows(payload);
  const exactSourceIcons = {};
  const exactNameIcons = {};
  const stats = {
    rows: Array.isArray(rows) ? rows.length : 0,
    skipped: 0
  };

  if (!Array.isArray(rows)) return buildEmptyPayload();

  for (const row of rows) {
    const icon = String(row?.icon ?? "").trim();
    if (!icon) {
      stats.skipped += 1;
      continue;
    }

    let registered = false;

    const sourceId = String(row?.sourceId ?? "").trim();
    if (sourceId) {
      exactSourceIcons[sourceId] = icon;
      registered = true;
    }

    // Always register the normalized name as a fallback, even when sourceId exists.
    // This lets migration resolve overrides for world/embedded Items that no longer
    // preserve compendiumSource, while exactSource remains the higher-priority match.
    const name = normalizeText(row?.name ?? "");
    if (name) {
      exactNameIcons[name] = icon;
      registered = true;
    }

    if (!registered) {
      stats.skipped += 1;
    }
  }

  return { exactSourceIcons, exactNameIcons, stats };
}

function buildCacheKey(force = false) {
  const moduleVersion = game.modules.get(MODULE_ID)?.version ?? "dev";
  if (!force) return moduleVersion;

  const entropy =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${moduleVersion}-${entropy}`;
}

export async function ensureIconOverridesLoaded({ force = false } = {}) {
  if (state.loaded && !force) return state;
  if (state.loading && !force) return state.loading;

  const generation = ++state.loadGeneration;

  state.loading = (async () => {
    try {
      const response = await fetch(
        `${OVERRIDES_PATH}?v=${encodeURIComponent(buildCacheKey(force))}`,
        {
          cache: force ? "reload" : "no-cache",
          headers: force
            ? {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache"
              }
            : {
                "Cache-Control": "no-cache"
              }
        }
      );

      if (!response.ok) {
        console.warn(
          `[${MODULE_ID}] could not load icon overrides from ${OVERRIDES_PATH} (${response.status}).`
        );
        if (generation !== state.loadGeneration) return state;
        return commitLoad(buildEmptyPayload());
      }

      const payload = await response.json();
      if (generation !== state.loadGeneration) return state;

      return commitLoad(parseOverrides(payload));
    } catch (error) {
      console.error(`[${MODULE_ID}] failed to load icon overrides`, error);
      if (generation !== state.loadGeneration) return state;
      return commitLoad(buildEmptyPayload());
    } finally {
      if (generation === state.loadGeneration) {
        state.loading = null;
      }
    }
  })();

  return state.loading;
}

export function getDynamicSourceIcons() {
  return state.exactSourceIcons;
}

export function getDynamicNameIcons() {
  return state.exactNameIcons;
}

export function getIconOverrideStats() {
  return state.stats;
}