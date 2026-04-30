console.log("executing:", "modal.js");

const eventModal = document.getElementById("event-modal");
const deleteEventBtn = document.getElementById("modal-delete-event-btn");

const deleteModal = document.getElementById("delete-modal");
const confirmCodeEl = document.getElementById("confirm-code");
const confirmInput = document.getElementById("confirm-input");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");

let generatedCode = null;
let currentEvent = null;

/* === FUNCTIONS === */
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

function closeEventModal() {
    currentEvent = null;
    eventModal.classList.add("hidden");
    document.body.style.overflow = "";
}

function closeDeleteModal() {
    deleteModal.classList.add("hidden");
    generatedCode = null;
}

/* === LISTENERS === */

/* event modal listeners */
eventModal.addEventListener("click", (event) => {
    if (event.target === eventModal) {
        closeEventModal();
    }
});

eventModal.querySelector("#modal-close").addEventListener("click", closeEventModal);

deleteEventBtn.addEventListener("click", openDeleteModal);

/* confirm delete modal listeners */
deleteModal.addEventListener("click", (event) => {
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});

deleteModal.querySelector("#modal-close").addEventListener("click", closeDeleteModal);

confirmInput.addEventListener("input", (event) => {
    confirmDeleteBtn.disabled = event.target.value !== generatedCode;
});

confirmDeleteBtn.addEventListener("click", async () => {
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
        console.error(error);
        return;
    }

    closeDeleteModal();
    closeEventModal();
    window.location.reload();
});



