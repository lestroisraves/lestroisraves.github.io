console.log("executing:", document.currentScript?.src);

import { openErrorModal, openSuccessModal } from "../global/modal.js";
import { initEventForm, getEventFormPayload, uploadImageFile } from "../global/eventform.js";

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
async function initSubmitPage() {
    const session = await getSessionUserProfile();
    if (session?.session?.user && session?.profile) {
        showSubmit(session.session.user, session.profile);
    } else {
        showLoginWarning();
    }
}

function showLoginWarning() {
    user_profile = null;
    noticeTip.classList.add("hidden");
    accountDetail.classList.remove("hidden");
    submitContainer.classList.add("hidden");
    window.location.href = "../account/";
}

function showSubmit(user, profile) {
    user_profile = profile;
    noticeTip.classList.remove("hidden");
    submitContainer.classList.remove("hidden");
    accountRole.innerText = APP_CONFIG.ROLES[user_profile.role];

    /* configure tip */ 
    noticeTipTitle.innerText = "Publiez ici un évènement";
    noticeTipText.innerText = "Suivant le type de contributeur que vous êtes, vous pouvez publier un nouvel évènement instantanément ou avec un délais de trois jours";

    /* configure roles */
    accountDetail.classList.remove("hidden");
    permissionDetails.innerHTML = renderAccountPermissionDetails();
    const permissionOfficial = permissionDetails.querySelector("#permission-official");
    const permissionAdmin = permissionDetails.querySelector("#permission-admin");

    switch(user_profile.role) {
        case 0: /* non official */
            permissionOfficial.classList.add("denied");
            permissionOfficial.classList.remove("granted");
            permissionOfficial.querySelector("#icon").innerText = "lock"
            permissionAdmin.classList.add("hidden");
            break;
        
        case 1: /* official */
            permissionOfficial.classList.remove("denied");
            permissionOfficial.classList.add("granted");
            permissionOfficial.querySelector("#icon").innerText = "check"
            permissionAdmin.classList.add("hidden");
            break;

        case 2:
        case 3: /* moderateur/admin */
            permissionOfficial.classList.remove("denied");
            permissionOfficial.classList.add("granted");
            permissionOfficial.querySelector("#icon").innerText = "check"
            permissionAdmin.classList.remove("hidden");
            break;
        
        default:
            permissionOfficial.classList.add("denied");
            permissionOfficial.classList.remove("granted");
            permissionOfficial.querySelector("#icon").innerText = "lock"
            permissionAdmin.classList.add("hidden");
    }

    /* initialize form */
    initEventForm();
}

/* === EXPORTED FUNCTIONS === */
export async function submitEvent() {
    const new_event = getEventFormPayload();
    const imageUrl = await uploadImageFile();

    for (let day = 0; day < new_event.nb_days; day++) {
        var payload = new_event.payload;
        payload.event_date = addDays(eventDate.value, day).toLocaleDateString("fr-CA")
        payload.pending = user_profile.role == 0
        payload.created_by = user_profile?.id ?? null
        payload.image_url = imageUrl
        console.log("submit event payload:", payload)

        const { data: event, error } = await window.supabaseClient.from("events").insert(payload);
        if (error) {
            button.setAttribute("aria-busy", "false");
            if ((nb_days > 1) && (day > 0)) {
                openErrorModal(`Problème de publication (jour ${day+1})\nCependant les premiers jours de l'évènement ont sans doute été publiés`);
            } else {
                openErrorModal("Problème de publication");
            }
            console.error(error);
            return;
        }
    }

    button.setAttribute("aria-busy", "false");
    window.scrollTo(0, 0);
    form.reset();
    openSuccessModal("Évènement publié !")
    
}

/* === INITIAL LOAD === */
initSubmitPage().catch(console.error);

