console.log("executing:", "modal.js");

const successModal = document.getElementById("success-modal");
const errorModal = document.getElementById("error-modal");

const eventModal = document.getElementById("event-modal");
const deleteEventBtn = document.getElementById("modal-delete-event-btn");
const acceptEventBtn = document.getElementById("modal-accept-event-btn");
const rejectEventBtn = document.getElementById("modal-reject-event-btn");

const profileModal = document.getElementById("profile-modal");
const acceptProfileBtn = document.getElementById("modal-accept-profile-btn");
const rejectProfileBtn = document.getElementById("modal-reject-profile-btn");

const confirmModal = document.getElementById("confirm-modal");
const confirmCodeEl = document.getElementById("confirm-code");
const confirmInput = document.getElementById("confirm-input");
const confirmBtn = document.getElementById("confirm-btn");

const officialRequestModal = document.getElementById("official-request-modal");
const officialRequestInput = document.getElementById("details-input");
const officialRequestSendBtn = document.getElementById("modal-official-request-btn");

let generatedCode = null;
let currentEvent = null;
let currentProfile = null;

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

    profileModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

export function openEventModal(event) {
    currentEvent = event;

    eventModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

export function openConfirmModal(type, action) {
    generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    confirmCodeEl.textContent = generatedCode;

    confirmInput.value = "";
    confirmBtn.disabled = true;
    confirmBtn.setAttribute("aria-busy", "false");

    confirmModal.classList.remove("hidden");
    confirmInput.focus();
}

export function openRoleRequestModal(profile) {
    currentProfile = profile;

    officialRequestInput.value = "";
    officialRequestSendBtn.disabled = true;
    officialRequestSendBtn.setAttribute("aria-busy", "false");

    officialRequestModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeSuccessModal() {
    successModal.classList.add("hidden");
    document.body.style.overflow = "";
}

function closeErrorModal() {
    errorModal.classList.add("hidden");
    document.body.style.overflow = "";
}

function closeProfileModal() {
    currentProfile = null;
    profileModal.classList.add("hidden");
    document.body.style.overflow = "";
}

function closeEventModal() {
    currentEvent = null;
    eventModal.classList.add("hidden");
    document.body.style.overflow = "";
}

function closeConfirmModal() {
    generatedCode = null;
    confirmModal.classList.add("hidden");
}

function closeRoleRequestModal() {
    currentProfile = null;
    officialRequestModal.classList.add("hidden");
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
    
}

async function rejectEvent(event) {
    
}

async function acceptProfile(profile) {
    
}

async function rejectprofile(profile) {
    
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
        closeEventModal();
    }
});

eventModal?.querySelector("#modal-close").addEventListener("click", closeEventModal);

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
        closeProfileModal();
    }
});

profileModal?.querySelector("#modal-close").addEventListener("click", closeProfileModal);

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
    if (!currentEvent) return;

    // ACTION
    const error = await deleteEvent(currentEvent);

    if (error) {
        openErrorModal("Un problème est survenu");
        console.error(error);
        return;
    }

    closeConfirmModal();
    closeEventModal();
    openSuccessModal("Évènement supprimé ! La page va se rafraichir automatiquement.");
    
    setTimeout(function () {
        window.location.reload();
    }, 3000);

});

/* role modal listeners */
officialRequestModal?.addEventListener("click", (event) => {
    if (event.target === officialRequestModal) {
        closeRoleRequestModal();
    }
});

officialRequestModal?.querySelector("#modal-close").addEventListener("click", closeRoleRequestModal);

officialRequestInput?.addEventListener("input", (event) => {
    officialRequestSendBtn.disabled = event.target.value.length < 50;
});

officialRequestSendBtn?.addEventListener("click", async () => {
    if (!currentProfile) return;

    officialRequestSendBtn.setAttribute("aria-busy", "true");

    // SUPABASE UPDATE PROFILES
    console.log("Official role request for user", currentProfile);
    const { data, error } = await window.supabaseClient
        .from("profiles")
        .update({
            official_request: true,
            official_request_details: officialRequestInput.value
        })
        .eq("id", currentProfile.id); // auth.uid()

    officialRequestSendBtn.setAttribute("aria-busy", "false");

    if (error) {
        openErrorModal("Un problème est survenu");
        console.error(error);
        return;
    }

    openSuccessModal("Requête envoyée !");
    closeRoleRequestModal();
});


