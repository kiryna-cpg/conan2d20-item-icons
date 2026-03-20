import { MODULE_ID } from "./constants.js";
import { RESETTABLE_ITEM_TYPES, resetIconsToSystemDefault } from "./reset-icons.js";

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

export class ResetIconsDialog extends foundry.applications.api.DialogV2 {
  constructor(options = {}) {
    super({
      window: {
        title: game.i18n.localize("C2I.ResetDialog.Title")
      },
      content: `
        <form class="c2i-reset-icons-dialog">
          <p>${game.i18n.localize("C2I.ResetDialog.Content")}</p>
          <fieldset style="border: 1px solid var(--color-border-light-2); padding: 0.75rem;">
            <legend>${game.i18n.localize("C2I.ResetDialog.TypesLegend")}</legend>
            ${buildCheckboxesHtml()}
          </fieldset>
        </form>
      `,
      buttons: [
        {
          action: "reset",
          label: game.i18n.localize("C2I.ResetDialog.Reset"),
          icon: "fa-solid fa-rotate-left",
          default: true,
          callback: (_event, button) => {
            return Array.from(button.form.querySelectorAll('input[name="types"]:checked')).map(
              (input) => input.value
            );
          }
        },
        {
          action: "cancel",
          label: game.i18n.localize("C2I.ResetDialog.Cancel"),
          icon: "fa-solid fa-xmark"
        }
      ],
      submit: async (result) => {
        if (!Array.isArray(result)) return;

        if (!result.length) {
          ui.notifications.warn(game.i18n.localize("C2I.Notification.ResetNoneSelected"));
          return;
        }

        try {
          const resetResult = await resetIconsToSystemDefault({ types: result });

          ui.notifications.info(
            game.i18n.format("C2I.Notification.ResetComplete", {
              world: resetResult.worldItemsUpdated,
              actorItems: resetResult.actorItemsUpdated,
              actors: resetResult.actorsTouched,
              unresolved: resetResult.unresolved
            })
          );
        } catch (error) {
          console.error(`[${MODULE_ID}] reset to system default failed`, error);
          ui.notifications.error(game.i18n.localize("C2I.Notification.ResetFailed"));
        }
      },
      ...options
    });
  }
}