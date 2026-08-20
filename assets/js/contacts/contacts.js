console.log("executing:", "contacts.js");

import { openErrorModal, openSuccessModal } from "../global/modal.js?v=a2f18444.1cd59a9";
import { configNoticeTip, showNoticeTip, showNoticeError, hideNoticeError, hideNoticeTip } from "../global/notices.js?v=a2f18444.1cd59a9";

/* === VARIABLES === */
const loading = document.getElementById("loading-screen");
const contactsContainer = document.getElementById("contacts-container");

let user_profile = null;

/* === LOCAL FUNCTIONS === */
async function initContactsPage() {
    console.log("init /contacts/ page");
    configNoticeTip("wide");

    /* show page */
    showNoticeTip("Retrouvez ci-dessous toute l'équipe de modération du site web.\n\nSi vous avez la moindre question, problème, suggestions d'amélioration du site, etc... soyez libre de contacter l'un de nous !", "Hello !");
    contactsContainer.hidden = false;
    loading.style.display = "none";
}

/* === EXPORTED FUNCTIONS === */
initContactsPage().catch(console.error);

