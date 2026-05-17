import { 
    closeModal, openConfirmModal, confirm,
    setConfirmBtnState
} from "../global/modal.js";

import { 
    submitEvent, priceChanged
} from "./submit.js"

import { 
    addTag, removeLastTag
} from "../global/tags.js"

/* === LOCAL FUNCTIONS === */
async function handleClick(el, e) {
    switch (el.dataset.action) {
         case "tag-input":
            if (event.key === "Enter" || event.key === ",") {
                event.preventDefault(); // prevent page scroll on Space
                addTag();
            } 
            if (e.key === "Backspace") {
                removeLastTag();
            }
            break;

        case "submit-event":
            await submitEvent();
            break;

        case "close-modal":
            closeModal(el);
            break;

        default:
            console.warn("unknown 'click' action:", el.dataset.action)
    }
}

async function handleChange(el) {
    switch (el.dataset.changeType) {
        case "price-choice":
            priceChanged(el);
            break;

        default:
            console.warn("unknown 'change' action:", el.dataset.changeType)
    }
}

/* === LISTENERS === */
document.addEventListener("click", async (event) => {
    if (!event.target.closest("[data-allow-action]") && event.target.closest("[data-no-action]")) return;
    const el = event.target.closest("[data-action]");
    if (!el) return;
    event.preventDefault(); // prevent page scroll on Space
    await handleClick(el, event);
});

document.addEventListener("change", (event) => {
    const el = event.target.closest("[data-change-type]");
    if (!el) return;
    event.preventDefault(); // prevent page scroll on Space
    handleChange(el);
});

