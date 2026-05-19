import { 
    closeModal, openConfirmModal, confirm,
    setConfirmBtnState
} from "../global/modal.js";

import { 
    priceChanged, handleImageChoice
} from "../global/eventform.js"

import { 
    addTag, removeLastTag
} from "../global/tags.js"

import { 
    submitEvent
} from "./submit.js"

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

        case "pick-file":
            document.getElementById("event-image").click()  // wrapper to input type="file"
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

        case "image-choice":
            const file = el.files[0];
            if (!file) return;
            await handleImageChoice(file);
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

document.addEventListener("keydown", async (event) => {
    if (!event.target.closest("[data-allow-action]") && event.target.closest("[data-no-action]")) return;
    const el = event.target.closest("[data-action]");
    if (!el) return;
    if (el.dataset.action != "tag-input") {
        event.preventDefault();
    }
    await handleClick(el, event);
});

document.addEventListener("change", (event) => {
    const el = event.target.closest("[data-change-type]");
    if (!el) return;
    event.preventDefault(); // prevent page scroll on Space
    handleChange(el);
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
});
