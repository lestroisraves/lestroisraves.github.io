console.log("executing:", "contacts.js");

import { openErrorModal, openSuccessModal } from "../global/modal.js?v=d4f3f045.1a479aa";
import { configNoticeTip, showNoticeTip, showNoticeError, hideNoticeError, hideNoticeTip } from "../global/notices.js?v=d4f3f045.1a479aa";

/* === VARIABLES === */
const loading = document.getElementById("loading-screen");
const contactsContainer = document.getElementById("contacts-container");
const teamList = document.getElementById("team-list");

let user_profile = null;

/* === LOCAL FUNCTIONS === */
async function initContactsPage() {
    console.log("init /contacts/ page");

    contactsContainer.hidden = false;
    loading.style.display = "none";

    await loadTeam();
}

function renderTeamTile(profile) {
    const roleLabel = APP_CONFIG.ROLES[profile.role] || "";

    return `
        <a class="team-tile" href="mailto:${profile.email}">
            <span class="team-avatar material-symbols-outlined" aria-hidden="true">person</span>
            <span class="team-info">
                <span class="team-name">${profile.name}</span>
                <span class="team-role">${roleLabel}</span>
                <span class="team-email">${profile.email}</span>
            </span>
        </a>
    `;
}

async function loadTeam() {
    if (!teamList) return;

    const { data, error } = await window.supabaseClient
        .from("profiles")
        .select("name, email, role")
        .gte("role", 2) /* modérateurs (2) et admins (3) */
        .order("role", { ascending: false })
        .order("name", { ascending: true });

    if (error) {
        console.error("failed to load team:", error);
        teamList.innerHTML = `<div class="team-empty">Impossible de charger l'équipe pour le moment.</div>`;
        return;
    }

    if (!data || data.length === 0) {
        teamList.innerHTML = `<div class="team-empty">Aucun membre pour le moment.</div>`;
        return;
    }

    teamList.innerHTML = data.map(renderTeamTile).join("");
}


/* === EXPORTED FUNCTIONS === */
initContactsPage().catch(console.error);

