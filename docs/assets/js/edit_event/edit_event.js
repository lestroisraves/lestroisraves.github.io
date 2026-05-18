console.log("executing:", "edit_event.js");

const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);
const eventId = params.get("id");

import { openErrorModal, openSuccessModal } from "../global/modal.js";
import { initEventForm, getEventFormPayload } from "../global/eventform.js";

/* === VARIABLES === */
const form = document.getElementById("event-form");
const accountDetail = document.getElementById("account-detail");
const accountRole = document.getElementById("account-role");
const permissionDetails = document.getElementById("detail-permission");
const submitContainer = document.getElementById("submit-container");
const noticeTip = document.getElementById("notice-tip");
const noticeTipTitle = noticeTip.querySelector("#title");
const noticeTipText = noticeTip.querySelector("#text");

let user_profile = null;

/* === LOCAL FUNCTIONS === */
async function initEditEventPage() {
    console.log("init /edit_event/ page");
    console.log("eventId:", eventId);

    submitContainer.classList.add("hidden");
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
    noticeTip.classList.add("hidden");
    submitContainer.classList.add("hidden");
    accountDetail.classList.add("hidden");
    window.location.href = "../account/";
}

function showEdit(user, profile, event) {
    user_profile = profile;
    
    /* configure tip */ 
    noticeTipTitle.innerText = "Editer votre évènement";
    noticeTipText.innerText = `Vous souhaitez ici éditer un évènement que vous avez créé le ${formatDateForUI(event.created_at)}`;

    /* initialize form */
    initEventForm(event);
    form.querySelector("#end_date_container").hidden = true;

    /* show page */
    noticeTip.classList.remove("hidden");
    accountDetail.classList.add("hidden");
    submitContainer.classList.remove("hidden");
}


/* === EXPORTED FUNCTIONS === */
export async function editEvent() {
    const new_event = await getEventFormPayload();
    const {imageUrl, error} = await uploadImageFile();
    
    if (error) {
        button.setAttribute("aria-busy", "false");
        openErrorModal("Problème pendant le téléchargement de l'image");
        console.error(error);
        return;
    }

    for (let day = 0; day < new_event.nb_days; day++) {
        var payload = new_event.payload;
        payload.event_date = addDays(eventDate.value, day).toLocaleDateString("fr-CA")
        payload.pending = user_profile.role == 0
        payload.created_by = user_profile?.id ?? null
        console.log("submit event payload (for edit):", payload)

        // const { data: event, error } = await window.supabaseClient.from("events").update(payload);
        // if (error) {
        //     button.setAttribute("aria-busy", "false");
        //     if ((nb_days > 1) && (day > 0)) {
        //         openErrorModal(`Problème de publication (jour ${day+1})\nCependant les premiers jours de l'évènement ont sans doute été publiés`);
        //     } else {
        //         openErrorModal("Problème de publication");
        //     }
        //     console.error(error);
        //     return;
        // }
    }

    button.setAttribute("aria-busy", "false");
    window.scrollTo(0, 0);
    form.reset();
    openSuccessModal("Évènement mis à jour !")
    
}

/* === INITIAL LOAD === */
initEditEventPage().catch(console.error);