console.log("executing:", "modal.js");

const successModal = document.getElementById("success-modal");
const errorModal = document.getElementById("error-modal");

const eventModal = document.getElementById("event-modal");
const eventModalCard = document.getElementById("event-card");
const eventModalContent = document.getElementById("event-modal-content");
const deleteEventBtn = document.getElementById("modal-delete-event-btn");
const acceptEventBtn = document.getElementById("modal-accept-event-btn");
const rejectEventBtn = document.getElementById("modal-reject-event-btn");

const profileModal = document.getElementById("profile-modal");
const acceptProfileBtn = document.getElementById("modal-accept-profile-btn");
const rejectProfileBtn = document.getElementById("modal-reject-profile-btn");

const updateRoleModal = document.getElementById("update-role-modal");
const updateRoleBtn = document.getElementById("modal-update-role-btn");

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

/* === FUNCTIONS === */
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

    switch (type) {
        case "my-event":
            eventModal.querySelector("#modal-actions-myevents").classList.remove("hidden");
            eventModal.querySelector("#modal-actions-pendingevents").classList.add("hidden");
            break;

        case "pending-event":
            eventModal.querySelector("#modal-actions-myevents").classList.add("hidden");
            eventModal.querySelector("#modal-actions-pendingevents").classList.remove("hidden");
            break;

        default:  // classic event
            eventModal.querySelector("#modal-actions-pendingevents").classList.add("hidden");
            if (user_profile && user_profile.id && ( (user_profile.id === eventData.created_by) || (user_profile.role >= 2)))
            {
                eventModal.querySelector("#modal-actions-myevents").classList.remove("hidden");
            }
            else
            {
                eventModal.querySelector("#modal-actions-myevents").classList.add("hidden");
            }
    }

    eventModalCard.classList.forEach(cls => {
        if (cls.startsWith("cat-")) {
            eventModalCard.classList.remove(cls);
        }
    });
    eventModalCard.classList.add("cat-" + eventData.category);

    eventData.imageHtml = eventData.image_url
        ? ` <div class="event-image-wrapper"><img src="${eventData.image_url}" class="event-thumbnail" alt="image évènement"></div>`
        : "";

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

    eventModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
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

export function openConfirmModal(type, action) {
    generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    confirmCodeEl.textContent = generatedCode;

    confirmInput.value = "";
    confirmBtn.disabled = true;

    switch (action) {
        case "delete":
            confirmTitle.innerHTML = "Pour <strong>supprimer l'évènement</strong>, tapez le code suivant :";
            confirmBtn.innerText = "Supprimer";
            confirmBtnIcon.innerText = "delete";
            confirmBtn.classList.add("delete");
            confirmBtn.classList.remove("info");
            confirmBtn.dataset.action = "delete-event";
            break;

        case "accept":
            if (type == "event") {
                confirmTitle.innerHTML = "Pour <strong>accepter la publication</strong>, tapez le code suivant :";
                confirmBtn.dataset.action = "accept-event";
            } else {
                confirmTitle.innerHTML = "Pour <strong>accepter la requête</strong>, tapez le code suivant :";
                confirmBtn.dataset.action = "accept-official-request";
            }
            confirmBtn.innerText = "Accepter";
            confirmBtn.classList.remove("delete");
            confirmBtn.classList.add("info");
            confirmBtnIcon.innerText = "check";
            break;

        case "reject":
            if (type == "event") {
                confirmTitle.innerHTML = "Pour <strong>rejeter la publication</strong>, tapez le code suivant :";
                confirmBtn.dataset.action = "reject-event";
            } else {
                confirmTitle.innerHTML = "Pour <strong>rejeter la requête</strong>, tapez le code suivant :";
                confirmBtn.dataset.action = "reject-official-request";
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

/* === LISTENERS === */

/* success modal */
successModal?.addEventListener("click", (event) => {
    if (event.target === successModal) {
        closeSuccessModal();
    }
});

successModal?.querySelector("#modal-close").addEventListener("click", closeSuccessModal);

/* error modal */
errorModal?.addEventListener("click", (event) => {
    if (event.target === errorModal) {
        closeErrorModal();
    }
});

errorModal?.querySelector("#modal-close").addEventListener("click", closeErrorModal);

/* event modal listeners */
eventModal?.addEventListener("click", (event) => {
    if (event.target === eventModal) {
        closeCurrentModal();
    }
});

eventModal?.querySelector("#modal-close").addEventListener("click", closeCurrentModal);

deleteEventBtn?.addEventListener("click", () => {
    openConfirmModal('event', 'delete');
});

acceptEventBtn?.addEventListener("click", () => {
    openConfirmModal('event', 'accept');
});

rejectEventBtn?.addEventListener("click", () => {
    openConfirmModal('event', 'reject');
});

/* profile modal listeners */
profileModal?.addEventListener("click", (event) => {
    if (event.target === profileModal) {
        closeCurrentModal();
    }
});

profileModal?.querySelector("#modal-close").addEventListener("click", closeCurrentModal);

acceptProfileBtn?.addEventListener("click", () => {
    openConfirmModal('profile', 'accept');
});

rejectProfileBtn?.addEventListener("click", () => {
    openConfirmModal('profile', 'reject');
});

/* confirm delete modal listeners */
confirmModal?.addEventListener("click", (event) => {
    if (event.target === confirmModal) {
        closeConfirmModal();
    }
});

confirmModal?.querySelector("#modal-close").addEventListener("click", closeConfirmModal);

confirmInput?.addEventListener("input", (event) => {
    confirmBtn.disabled = event.target.value !== generatedCode;
});

confirmBtn?.addEventListener("click", async () => {
    const action = confirmBtn.dataset.action;
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

});

/* role modal listeners */
officialRequestModal?.addEventListener("click", (event) => {
    if (event.target === officialRequestModal) {
        closeCurrentModal();
    }
});

officialRequestModal?.querySelector("#modal-close").addEventListener("click", closeCurrentModal);

officialRequestInput?.addEventListener("input", (event) => {
    officialRequestSendBtn.disabled = event.target.value.length < 100;
    officialRequestCharCount.innerText = event.target.value.length;
});

officialRequestSendBtn?.addEventListener("click", async () => {
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
});


