import { 
    closeModal, openConfirmModal, confirm,
    setConfirmBtnState
} from "../global/modal.js";

import { 
    openEvent, resetFilter, applyFilter,
    selectTab
} from "./events.js"

import { 
    addTag, removeLastTag
} from "../global/tags.js"

/* === LOCAL FUNCTIONS === */
async function handleAction(el, e) {
    switch (el.dataset.action) {
        case "select-tab":
            selectTab(el);
            break;

        case "reset-filter":
            resetFilter();
            break;

        case "apply-filter":
            applyFilter();
            break;

        case "tag-input":
            if (event.key === "Enter" || event.key === ",") {
                event.preventDefault(); // prevent page scroll on Space
                addTag();
            } 
            if (e.key === "Backspace") {
                removeLastTag();
            }
            break;

        case "accordion":
            handleAccordion(el, el.dataset.accordionId);
            break;

        case "show-event":
            openEvent(el.dataset.eventId);
            break;

        case "open-confirm-modal":
            openConfirmModal(el.dataset.type, el.dataset.actionType);
            break;

        case "confirm":
            await confirm(el.dataset.action);
            break;

        case "close-modal":
            closeModal(el);
            break;

        default:
            console.warn("unknown 'click' action:", el.dataset.action)
    }
}

async function handleInput(type, el) {
    switch (type) {
        case "confirm-code":
            setConfirmBtnState(el);
            break;

        default:
            console.warn("unknown 'input' type:", type)
    }
}

/* === LISTENERS === */
document.addEventListener("click", async (event) => {
    if (!event.target.closest("[data-allow-action]") && event.target.closest("[data-no-action]")) return;
    const el = event.target.closest("[data-action]");
    if (!el) return;
    event.preventDefault(); // prevent page scroll on Space
    await handleAction(el, event);
});

document.addEventListener("keydown", async (event) => {
    if (!event.target.closest("[data-allow-action]") && event.target.closest("[data-no-action]")) return;
    const el = event.target.closest("[data-action]");
    if (!el) return;
    if (el.dataset.action != "tag-input") {
        event.preventDefault();
    }
    await handleAction(el, event);
});

document.addEventListener("input", (event) => {
    const el = event.target.closest("[data-input-type]");
    if (!el) return;
    event.preventDefault(); // prevent page scroll on Space
    handleInput(el.dataset.inputType, el);
});

