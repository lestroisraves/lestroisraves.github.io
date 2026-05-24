import { 
    closeModal, openConfirmModal, confirm,
    setConfirmBtnState
} from "../global/modal.js";

import { 
    openEvent, searchInput, 
    selectTab, selectFilterOption, toggleAdditionalFilter,
    switchView, navPrevMonth, navNextMonth, navToday, calendarSelectDay,
    handleSwipe
} from "./events.js"

const container = document.getElementById("events");
const header = document.getElementById("event-list-header");
const tabs = document.getElementById("event-tabs");

/* === LOCAL FUNCTIONS === */
async function handleClick(el, e) {
    switch (el.dataset.action) {
        case "select-tab":
            selectTab(el);
            break;

        case "select-option":
            selectFilterOption(el);
            break;

        case "filter-toggle":
            toggleAdditionalFilter(el);
            break;

        case "switch-view":
            switchView(el.dataset.view);
            break;

        case "nav-prev-month":
            navPrevMonth();
            break;

        case "nav-next-month":
            navNextMonth();
            break;

        case "nav-today":
            navToday();
            break;

        case "calendar-select-day":
            calendarSelectDay(el.dataset.date);
            break;

        case "show-event":
            openEvent(el.dataset.eventId);
            break;

        case "share-event":
            break;

        case "edit-event":
            window.location.href = `../edit_event#id=${el.dataset.id}`;
            break;

        case "open-confirm-modal":
            openConfirmModal(el.dataset.type, el.dataset.actionType);
            break;

        case "confirm":
            await confirm(el.dataset.actionType);
            break;

        case "close-modal":
            closeModal(el);
            break;

        default:
            console.warn("unknown 'click' action:", el.dataset.action)
    }
}

async function handleInput(el) {
    switch (el.dataset.inputType) {
        case "event-search":
            searchInput(el);
            break;

        case "confirm-code":
            setConfirmBtnState(el);
            break;

        default:
            console.warn("unknown 'input' type:", el.dataset.inputType)
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

document.addEventListener("input", (event) => {
    const el = event.target.closest("[data-input-type]");
    if (!el) return;
    event.preventDefault(); // prevent page scroll on Space
    handleInput(el);
});

document.addEventListener("submit", (event) => {
    event.preventDefault();
});

