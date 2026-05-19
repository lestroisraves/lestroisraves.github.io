console.log("executing:", "edit_event.js");

import { openErrorModal, openSuccessModal } from "../global/modal.js";
import { initEventForm, getEventFormPayload, uploadImageFile } from "../global/eventform.js";
import { configNoticeTip, showNoticeTip, showNoticeError, hideNoticeError, hideNoticeTip } from "../global/notices.js";

/* === VARIABLES === */
const hash = window.location.hash.substring(1);
const previousPage = document.referrer;
const params = new URLSearchParams(hash);
const eventId = params.get("id");

const form = document.getElementById("event-form");
const accountDetail = document.getElementById("account-detail");
const accountRole = document.getElementById("account-role");
const permissionDetails = document.getElementById("detail-permission");
const submitContainer = document.getElementById("submit-container");

let user_profile = null;

/* === LOCAL FUNCTIONS === */
async function initEditEventPage() {
    console.log("init /edit_event/ page");
    console.log("eventId:", eventId);

    submitContainer.hidden = true;
    const session = await getSessionUserProfile();
    if (session?.session?.user && session?.profile) {
        // get event
         const { data, error } = await window.supabaseClient
            .from("future_events")
            .select("*")
            .eq("id", eventId).single()

        if (error) {
            console.log("Error:", error);
            // window.location.href = "../";
            openErrorModal("ERREUR survenue durant le chargement de l'évènement");
            return;
        }
        showEdit(session.session.user, session.profile, data);
    } else {
        showLoginWarning();
    }
}

function showLoginWarning() {
    user_profile = null;
    hideNoticeTip();
    submitContainer.hidden = true;
    accountDetail.hidden = true;
    window.location.href = "../account/";
}

function showEdit(user, profile, event) {
    user_profile = profile;
    
    configNoticeTip("wide");
    showNoticeTip(`Vous souhaitez ici éditer un évènement que vous avez créé le ${formatDateForUI(event.created_at)}`, "Editer votre évènement");

    /* initialize form */
    initEventForm(event);
    form.querySelector("#end_date_container").hidden = true;
    form.querySelector("#cancel-btn").hidden = false;
    form.querySelector("#cancel-btn").disabled = false;

    /* show page */
    accountDetail.hidden = true;
    submitContainer.hidden = false;
}

/* === EXPORTED FUNCTIONS === */
export function goBack(){
    window.location.href = `${previousPage}#id=${eventId}&type=myevent`;
}

export async function editEvent() {
    const new_event = await getEventFormPayload();
    const {image_url, error: upload_error} = await uploadImageFile();
    
    if (upload_error) {
        button.setAttribute("aria-busy", "false");
        openErrorModal("Problème pendant le téléchargement de l'image");
        console.error(error);
        return;
    }

    var payload = new_event.payload;
    payload.event_date = form.querySelector("#event_date").value;
    payload.pending = user_profile.role == 0;
    payload.created_by = user_profile?.id ?? null;
    payload.image_url = image_url;
    console.log("submit event payload (for edit):", payload);

    const { error } = await window.supabaseClient
        .from("events")
        .update(payload)
        .eq("id", eventId);

    if (error) {
        button.setAttribute("aria-busy", "false");
        openErrorModal("Problème de mise à jour");
        console.error(error);
        return;
    }

    button.setAttribute("aria-busy", "false");
    window.scrollTo(0, 0);
    form.reset();
    openSuccessModal("Évènement mis à jour ! Retour à la liste des évènements automatiquement.");

    setTimeout(function () {
        window.location.href = "..";
    }, 3000);
}

/* === INITIAL LOAD === */
initEditEventPage().catch(console.error);