import {
    showSignup, showLogin, showResetPassword, signup, login, logout,
    sendResetPasswordRequest, updateProfileRole, openPendingEvent, openMyEvent, openProfile,
    searchInput
} from "./account.js";

import { 
    openRoleRequestModal, 
    closeModal, openConfirmModal, confirm,
    setConfirmBtnState, setSendBtnState
} from "../global/modal.js";


async function handleAction(el) {
    switch (el.dataset.action) {
        case "show-signup":
            showSignup();
            break;

        case "show-signin":
            showLogin();
            break;

        case "show-reset-password":
            showResetPassword();
            break;

        case "signup":
            await signup();
            break;

        case "login":
            await login();
            break;

        case "logout":
            await logout();
            break;
        
        case "send-reset-password-request":
            await sendResetPasswordRequest();
            break;

        case "accordion":
            handleAccordion(el, el.dataset.accordionId);
            break;

        case "update-profile-role":
            updateProfileRole();
            break;

        case "open-request-modal":
            if (!user_profile) return;
            openRoleRequestModal(user_profile);
            break;

        case "show-pendingevent":
            openPendingEvent(el.dataset.showPendingeventId);
            break;

        case "show-profile":
            openProfile(el.dataset.showProfileId);
            break;

        case "show-myevent":
            openMyEvent(el.dataset.showMyeventId);
            break;

        case "send-official-request":
            await sendOfficialRequest();
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
        case "data-search":
            searchInput(el);
            break;

        case "confirm-code":
            setConfirmBtnState(el);
            break;

        case "request-details":
            setSendBtnState(el);
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
    await handleAction(el);
});


document.addEventListener("keydown", async (event) => {
    if (!event.target.closest("[data-allow-action]") && event.target.closest("[data-no-action]")) return;
    const el = event.target.closest("[data-action]");
    if (!el) return;
    event.preventDefault(); // prevent page scroll on Space
    await handleAction(el);
});

document.addEventListener("input", (event) => {
    const el = event.target.closest("[data-input-type]");
    if (!el) return;
    event.preventDefault(); // prevent page scroll on Space
    handleInput(el.dataset.inputType, el);
});