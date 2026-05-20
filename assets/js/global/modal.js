console.log("executing:", "modal.js");

const successModal = document.getElementById("success-modal");
const errorModal = document.getElementById("error-modal");

const eventModal = document.getElementById("event-modal");
const eventModalCard = document.getElementById("event-card");
const eventModalContent = document.getElementById("event-modal-content");

const profileModal = document.getElementById("profile-modal");
const profileModalContent = document.getElementById("profile-modal-content");

const updateRoleModal = document.getElementById("update-role-modal");

const confirmModal = document.getElementById("confirm-modal");
const confirmTitle = document.getElementById("confirm-title");
const confirmCodeEl = document.getElementById("confirm-code");
const confirmInput = document.getElementById("confirm-input");
const confirmBtn = document.getElementById("confirm-btn");
const confirmBtnIcon = document.getElementById("confirm-btn-icon");

const officialRequestModal = document.getElementById("official-request-modal");
const officialRequestInput = document.getElementById("details-input");
const officialRequestCharCount = document.getElementById("request-char-count");
const officialRequestSendBtn = document.getElementById("modal-official-request-btn");

let generatedCode = null;
let currentEvent = null;
let currentProfile = null;
let currentModal = null;

/* === LOCAL FUNCTIONS === */
function closeSuccessModal() {
    successModal.classList.add("hidden");
    document.body.style.overflow = "";
}

function closeErrorModal() {
    errorModal.classList.add("hidden");
    document.body.style.overflow = "";
}

function closeCurrentModal() {
    if (currentModal) {
        currentModal.classList.add("hidden");
        document.body.style.overflow = "";
        currentModal = null;
        currentProfile = null;
        currentEvent = null;
    }
}

function closeConfirmModal() {
    generatedCode = null;
    confirmModal.classList.add("hidden");
}

async function deleteEvent(event) {
    console.log("deleting event:", event.id);
    const { data, error } = await window.supabaseClient
        .from("events")
        .delete()
        .eq("id", event.id);
    return error;
}

async function acceptEvent(event) {
    console.log("accepting event:", event.id);
    const { error } = await window.supabaseClient
        .from("events")
        .update({
            pending: false
        })
        .eq("id", event.id);
    return error;

    // todo: send email
}

async function rejectEvent(event) {
    console.log("rejecting event:", event.id);
    const error = await deleteEvent(event);  // if event rejected, it is deleted

    // todo: send email
}

async function acceptProfile(profile) {
    console.log("accepting official request from user:", profile.id);
    const { error } = await window.supabaseClient
        .from("profiles")
        .update({
            role: 1,
            official_request: false
        })
        .eq("id", profile.id);
    return error;

    // todo: send email
}

async function rejectprofile(profile) {
    console.log("rejecting official request from user:", profile.id);
    const { error } = await window.supabaseClient
        .from("profiles")
        .update({
            official_request: false
        })
        .eq("id", profile.id);
    return error;

    // todo: send email
}

/* === EXPORTED FUNCTIONS === */
export function openSuccessModal(text) {
    successModal.querySelector("#text").innerText = text;
    successModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

export function openErrorModal(text) {
    errorModal.querySelector("#text").innerText = text;
    errorModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

export function openProfileModal(profile) {
    currentProfile = profile;
    currentModal = profileModal;

    profileModalContent.innerHTML = `
        <div class="account-section-title">
            <span class="material-symbols-outlined" aria-hidden="true">person</span>
            <span id="account-name" class="account-name">${profile.name}</span>
        </div>

        <div class="account-details">
            <div class="detail-section">
                <div class="detail-row">
                    <span class="label">Email</span>
                    <span id="account-email" class="value detail-user">${profile.email}</span>
                </div>
            </div>
        </div>

        <div class="account-section-title">
            <span class="material-symbols-outlined" aria-hidden="true">format_quote</span>
            <span class="account-name">Description de la demande</span>
        </div>
        <blockquote class="user-quote">${linkify(profile.official_request_details)}</blockquote>
    `;

    profileModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

export function openUpdateRoleModal() {
    currentModal = updateRoleModal;
    updateRoleModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

export function openEventModal(event, type, user_profile=null) {
    currentEvent = event;
    currentModal = eventModal;

    const eventData = renderEventData(event, true);

    eventModal.querySelector("#modal-share-event-btn").dataset.id = currentEvent.id;
    eventModal.querySelector("#modal-edit-event-btn").dataset.id = currentEvent.id;

    switch (type) {
        case "my-event":
            eventModal.querySelector("#modal-edit-event-btn").classList.remove("hidden");
            eventModal.querySelector("#modal-delete-event-btn").classList.remove("hidden");
            eventModal.querySelector("#modal-accept-event-btn").classList.add("hidden");
            eventModal.querySelector("#modal-reject-event-btn").classList.add("hidden");
            break;

        case "pending-event":
            eventModal.querySelector("#modal-edit-event-btn").classList.add("hidden");
            eventModal.querySelector("#modal-delete-event-btn").classList.add("hidden");
            eventModal.querySelector("#modal-accept-event-btn").classList.remove("hidden");
            eventModal.querySelector("#modal-reject-event-btn").classList.remove("hidden");
            break;

        default:  // classic event
            if (user_profile && user_profile.id && ( (user_profile.id === eventData.created_by) || (user_profile.role >= 2)))
            {
                eventModal.querySelector("#modal-edit-event-btn").classList.remove("hidden");
                eventModal.querySelector("#modal-delete-event-btn").classList.remove("hidden");
            }
            else
            {
                eventModal.querySelector("#modal-edit-event-btn").classList.add("hidden");
                eventModal.querySelector("#modal-delete-event-btn").classList.add("hidden");
            }
            eventModal.querySelector("#modal-accept-event-btn").classList.add("hidden");
            eventModal.querySelector("#modal-reject-event-btn").classList.add("hidden");
    }

    eventData.imageHtml = eventData.image_url
        ? ` <div class="event-image-wrapper">
                <div class="image-placeholder"><span id="img-ico" class="material-symbols-outlined">image</span></div>
                <img class="event-thumbnail" alt="image évènement">
            </div>`
        : ` <div class="event-image-wrapper">
                <div class="image-placeholder no-image"><span id="img-ico" class="material-symbols-outlined">${APP_CONFIG.CATEGORIES[eventData.category]["icon"]}</span></div>
            </div>`;

    eventData.pendingHtml = eventData.pending
        ? ` <div class="event-meta pending">
                ${renderMaterialIconText("hourglass_top", "En attente de publication")}
            </div>`
        : "";

    eventModalContent.innerHTML = `
        ${eventData.imageHtml}
        <div id="modal-title" class="event-title">${event.title}</div>
        ${eventData.categoryHtml}
        <div class="event-meta place">
            ${eventData.locationHtml}
        </div>
        <div class="event-meta">
            ${renderMaterialIconText("event", formatEventDateTime(eventData.event_date, eventData.event_start_time))}
        </div>
        <div class="event-meta place">
            ${renderMaterialIconText("sell", eventData.price)}
        </div>
        <div class="event-meta place">
            ${eventData.parentalGuideHtml}
        </div>
        ${eventData.addressHtml}
        ${eventData.eatHtml}
        ${eventData.siteUrlHtml}
        ${eventData.phoneHtml}
        ${eventData.pendingHtml}
        ${eventData.tagsHtml}
        ${eventData.descriptionHtml}
    `;

    /* apply category style */
    eventModalCard.style.borderColor = APP_CONFIG.CATEGORIES[eventData.category]["color"];
    eventModalContent.querySelector(".image-placeholder").style.background = APP_CONFIG.CATEGORIES[eventData.category]["color_light"];
    eventModalContent.querySelector("#img-ico").style.color = APP_CONFIG.CATEGORIES[eventData.category]["color"];


    if (eventData.image_url) {
        setEventImage(eventModalContent, event.image_url);
    }

    document.body.style.overflow = "hidden";
    eventModal.classList.remove("hidden");
    eventModal.scrollTop = 0;
}

export function openRoleRequestModal(profile) {
    currentProfile = profile;
    currentModal = officialRequestModal;
    officialRequestInput.value = "";
    officialRequestSendBtn.disabled = true;
    officialRequestSendBtn.setAttribute("aria-busy", "false");

    officialRequestModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

export function openConfirmModal(type, action_type) {
    generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    confirmCodeEl.textContent = generatedCode;

    confirmInput.value = "";
    confirmBtn.disabled = true;

    switch (action_type) {
        case "delete":
            confirmTitle.innerHTML = "Pour <strong>supprimer l'évènement</strong>, tapez le code suivant :";
            confirmBtn.innerText = "Supprimer";
            confirmBtnIcon.innerText = "delete";
            confirmBtn.classList.add("delete");
            confirmBtn.classList.remove("info");
            confirmBtn.dataset.actionType = "delete-event";
            break;

        case "accept":
            if (type == "event") {
                confirmTitle.innerHTML = "Pour <strong>accepter la publication</strong>, tapez le code suivant :";
                confirmBtn.dataset.actionType = "accept-event";
            } else {
                confirmTitle.innerHTML = "Pour <strong>accepter la requête</strong>, tapez le code suivant :";
                confirmBtn.dataset.actionType = "accept-official-request";
            }
            confirmBtn.innerText = "Accepter";
            confirmBtn.classList.remove("delete");
            confirmBtn.classList.add("info");
            confirmBtnIcon.innerText = "check";
            break;

        case "reject":
            if (type == "event") {
                confirmTitle.innerHTML = "Pour <strong>rejeter la publication</strong>, tapez le code suivant :";
                confirmBtn.dataset.actionType = "reject-event";
            } else {
                confirmTitle.innerHTML = "Pour <strong>rejeter la requête</strong>, tapez le code suivant :";
                confirmBtn.dataset.actionType = "reject-official-request";
            }
            confirmBtn.innerText = "Rejeter";
            confirmBtn.classList.add("delete");
            confirmBtn.classList.remove("info");
            confirmBtnIcon.innerText = "close";
            break;

        default:
            confirmTitle.innerHTML = "";
            confirmBtn.innerText = "";
            confirmBtnIcon.innerText = "";
            confirmBtn.classList.remove("delete");
            confirmBtn.classList.remove("info");
            confirmBtn.dataset.action = "";
            return;
            
    }

    confirmModal.classList.remove("hidden");
    confirmInput.focus();
}

export async function confirm(action) {
    var successMsg = "";
    var error = null;
    switch (action) {
        
        case "delete-event":
            if (!currentEvent) return;
            error = await deleteEvent(currentEvent);
            successMsg = "Évènement supprimé ! La page va se rafraichir automatiquement."
            break;

        case "accept-event":
            if (!currentEvent) return;
            error = await acceptEvent(currentEvent);
            successMsg = "Évènement accepté ! La page va se rafraichir automatiquement."
            break;

        case "reject-event":
            if (!currentEvent) return;
            error = await rejectEvent(currentEvent);
            successMsg = "Évènement rejeté ! La page va se rafraichir automatiquement."
            break;

        case "accept-official-request":
            if (!currentProfile) return;
            error = await acceptProfile(currentProfile);
            successMsg = "Requête acceptée ! La page va se rafraichir automatiquement."
            break;

        case "reject-official-request":
            if (!currentProfile) return;
            error = await rejectprofile(currentProfile);
            successMsg = "Requête rejetée ! La page va se rafraichir automatiquement."
            break;

        default:
            console.warn("Unknown action:", action);
            return;
    }

    if (error) {
        openErrorModal("Un problème est survenu");
        console.error(error);
        return;
    }

    openSuccessModal(successMsg);
    closeConfirmModal();
    closeCurrentModal();
    
    setTimeout(function () {
        window.location.reload();
    }, 3000);
}

export function closeModal(target) {
    const modal = target.closest(".modal-overlay");
    if (!modal) return;
    switch (modal.id) {
        case "success-modal":
            closeSuccessModal();
            break;

        case "error-modal":
            closeErrorModal();
            break;

        case "confirm-modal":
            closeConfirmModal();
            break;

        case "event-modal":
        case "profile-modal":
        case "official-request-modal":
            closeCurrentModal();
            break;
    }
}

export async function sendOfficialRequest() {
    if (!currentProfile) return;

    // SUPABASE UPDATE PROFILES
    console.log("Official role request for user", currentProfile);
    const { error } = await window.supabaseClient
        .from("profiles")
        .update({
            official_request: true,
            official_request_details: officialRequestInput.value
        })
        .eq("id", currentProfile.id); // auth.uid()

    if (error) {
        openErrorModal("Un problème est survenu");
        console.error(error);
        return;
    }

    openSuccessModal("Requête envoyée !");
    closeCurrentModal();
}

export function setConfirmBtnState(target) {
    confirmBtn.disabled = target.value !== generatedCode;
}

export function setSendBtnState(target) {
    officialRequestSendBtn.disabled = target.value.length < 100;
    officialRequestCharCount.innerText = target.value.length;
}

