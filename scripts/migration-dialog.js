import { MODULE_ID } from "./constants.js";
import { runIconMigration } from "./migration.js";
import { RESETTABLE_ITEM_TYPES } from "./reset-icons.js";

function buildCheckboxesHtml() {
  return RESETTABLE_ITEM_TYPES.map(
    (entry) => `
      <label class="checkbox" style="display:block; margin: 0 0 0.25rem 0;">
        <input type="checkbox" name="types" value="${entry.key}" checked>
        ${game.i18n.localize(entry.label)}
      </label>
    `
  ).join("");
}

export class MigrationIconsDialog extends foundry.applications.api.DialogV2 {
  constructor(options = {}) {
    super({
      window: {
        title: game.i18n.localize("C2I.MigrationDialog.Title")
      },
      content: `
        <form class="c2i-migration-dialog">
          <p>${game.i18n.localize("C2I.MigrationDialog.Content")}</p>

          <fieldset style="border: 1px solid var(--color-border-light-2); padding: 0.75rem; margin-bottom: 0.75rem;">
            <legend>${game.i18n.localize("C2I.MigrationDialog.TypesLegend")}</legend>
            ${buildCheckboxesHtml()}
          </fieldset>

          <fieldset style="border: 1px solid var(--color-border-light-2); padding: 0.75rem;">
            <legend>${game.i18n.localize("C2I.MigrationDialog.OptionsLegend")}</legend>
            <label class="checkbox" style="display:block; margin: 0 0 0.25rem 0;">
              <input type="checkbox" name="overwriteCustomIcons">
              ${game.i18n.localize("C2I.Setting.OverwriteCustomIcons.Name")}
            </label>
            <p class="hint" style="margin: 0;">
              ${game.i18n.localize("C2I.Setting.OverwriteCustomIcons.Hint")}
            </p>
          </fieldset>
        </form>
      `,
      buttons: [
        {
          action: "migrate",
          label: game.i18n.localize("C2I.MigrationDialog.Run"),
          icon: "fa-solid fa-wand-magic-sparkles",
          default: true,
          callback: (_event, button) => {
            return {
              types: Array.from(
                button.form.querySelectorAll('input[name="types"]:checked')
              ).map((input) => input.value),
              overwriteCustomIcons: button.form.querySelector(
                'input[name="overwriteCustomIcons"]'
              )?.checked === true
            };
          }
        },
        {
          action: "cancel",
          label: game.i18n.localize("C2I.MigrationDialog.Cancel"),
          icon: "fa-solid fa-xmark"
        }
      ],
      submit: async (result) => {
        if (!result || !Array.isArray(result.types)) return;

        if (!result.types.length) {
          ui.notifications.warn(
            game.i18n.localize("C2I.Notification.MigrationNoneSelected")
          );
          return;
        }

        try {
          const migrationResult = await runIconMigration({
            overwriteCustomIcons: !!result.overwriteCustomIcons,
            types: result.types
          });

          ui.notifications.info(
            game.i18n.format("C2I.Notification.MigrationComplete", {
              world: migrationResult.worldItemsUpdated,
              actorItems: migrationResult.actorItemsUpdated,
              actors: migrationResult.actorsTouched
            })
          );
        } catch (error) {
          console.error(`[${MODULE_ID}] migration failed`, error);
          ui.notifications.error(
            game.i18n.localize("C2I.Notification.MigrationFailed")
          );
        }
      },
      ...options
    });
  }
}