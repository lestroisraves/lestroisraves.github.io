console.log("executing:", "modal.js");

const successModal = document.getElementById("success-modal");
const errorModal = document.getElementById("error-modal");

const eventModal = document.getElementById("event-modal");
const deleteEventBtn = document.getElementById("modal-delete-event-btn");

const deleteModal = document.getElementById("delete-modal");
const confirmCodeEl = document.getElementById("confirm-code");
const confirmInput = document.getElementById("confirm-input");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");

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

export function openEventModal(event) {
    currentEvent = event;

    eventModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

export function openDeleteModal() {
    generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    confirmCodeEl.textContent = generatedCode;

    confirmInput.value = "";
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.setAttribute("aria-busy", "false");

    deleteModal.classList.remove("hidden");
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

function closeEventModal() {
    currentEvent = null;
    eventModal.classList.add("hidden");
    document.body.style.overflow = "";
}

function closeDeleteModal() {
    generatedCode = null;
    deleteModal.classList.add("hidden");
}

function closeRoleRequestModal() {
    currentProfile = null;
    officialRequestModal.classList.add("hidden");
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

deleteEventBtn?.addEventListener("click", openDeleteModal);

/* confirm delete modal listeners */
deleteModal?.addEventListener("click", (event) => {
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});

deleteModal?.querySelector("#modal-close").addEventListener("click", closeDeleteModal);

confirmInput?.addEventListener("input", (event) => {
    confirmDeleteBtn.disabled = event.target.value !== generatedCode;
});

confirmDeleteBtn?.addEventListener("click", async () => {
    if (!currentEvent) return;

    confirmDeleteBtn.setAttribute("aria-busy", "true");

    // SUPABASE DELETE
    console.log("Deleting event:", currentEvent.id);
    const { data, error } = await window.supabaseClient
        .from("events")
        .delete()
        .eq("id", currentEvent.id);

    confirmDeleteBtn.setAttribute("aria-busy", "false");

    if (error) {
        openErrorModal("Un problème est survenu");
        console.error(error);
        return;
    }

    closeDeleteModal();
    closeEventModal();
    openSuccessModal("Évènement supprimé ! La page va se rafraichir automatiquement.");
    
    setTimeout(function () {
        window.location.reload();
    }, 3000);

});

/* role modal listeners */
officialRequestModal?.addEventListener("click", (event) => {
    if (event.target === officialRequestModal) {
        closeEventModal();
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


