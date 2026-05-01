console.log("executing:", document.currentScript?.src);

import { openRoleRequestModal, openErrorModal, openSuccessModal } from "./modal.js";

/* === VARIABLES === */
let user_profile = null;

const rstPwdContainer = document.getElementById("rstpwd-container");
const signInContainer = document.getElementById("signin-container");
const signupContainer = document.getElementById("signup-container");
const accountContainer = document.getElementById("account-container");
const noticeTip = document.getElementById("notice-tip");
const noticeTipText = noticeTip.querySelector("#text");
const noticeError = document.getElementById("notice-error");
const noticeErrorText = noticeError.querySelector("#text");

const officialRequestModal = document.getElementById("official-request-modal");

const myEvents = document.getElementById("my-events");
const adminSection = document.getElementById("admin-section");
const officialRequests = document.getElementById("official-requests");
const pendingEvents = document.getElementById("pending-events");

/* === FUNCTIONS === */
function showNoticeTip(message) {
    noticeTip.classList.remove("hidden");
    noticeTipText.innerText = message;
    noticeTip.focus();
}

function showError(message) {
    noticeError.classList.remove("hidden");
    noticeErrorText.innerText = message;
    noticeError.focus();
}

function hideErrorNotice() {
    noticeError.classList.add("hidden");
}

function showResetPassword() {
    signInContainer.classList.add("hidden");
    rstPwdContainer.classList.remove("hidden");
    signupContainer.classList.add("hidden");
    accountContainer.classList.add("hidden");
    hideErrorNotice();
    showNoticeTip("Demandez la réinitialisation de votre mot de passe et vous recevrer un email de:\n" + APP_CONFIG.EMAIL_ADDRESS);
}

function showLogin() {
    signInContainer.classList.remove("hidden");
    rstPwdContainer.classList.add("hidden");
    signupContainer.classList.add("hidden");
    accountContainer.classList.add("hidden");
    hideErrorNotice();
    showNoticeTip("Connectez vous pour publier vos événements et contribuer à l'agenda culturel.");
}

function showSignup() {
    signInContainer.classList.add("hidden");
    rstPwdContainer.classList.add("hidden");
    signupContainer.classList.remove("hidden");
    accountContainer.classList.add("hidden");
    hideErrorNotice();
    showNoticeTip("Créez un compte pour publier vos événements et contribuer à l'agenda culturel.");
}

async function showAccount(user, profile) {
    user_profile = profile;
    console.log("user_profile:", user_profile);

    signInContainer.classList.add("hidden");
    rstPwdContainer.classList.add("hidden");
    signupContainer.classList.add("hidden");
    accountContainer.classList.remove("hidden");
    noticeTip.classList.add("hidden");
    hideErrorNotice();

    document.getElementById("account-email").innerText = user.email;
    document.getElementById("account-name").innerText = profile.name;
    document.getElementById("account-role").innerText = APP_CONFIG.ROLES[user_profile.role];

    /* configure roles */
    const details = document.getElementById("detail-section");
    const permissionOfficial = details.querySelector("#permission-official");
    const permissionAdmin = details.querySelector("#permission-admin");
    const roleRequest = details.querySelector("#role-request");

    switch(user_profile.role) {

        case 0: /* non official */
            permissionOfficial.classList.add("denied");
            permissionOfficial.classList.remove("granted");
            permissionOfficial.querySelector("#icon").innerText = "lock"
            permissionAdmin.classList.add("hidden");
            roleRequest.classList.remove("hidden");
            adminSection.classList.add("hidden");
            break;
        
        case 1: /* official */
            permissionOfficial.classList.remove("denied");
            permissionOfficial.classList.add("granted");
            permissionOfficial.querySelector("#icon").innerText = "check"
            permissionAdmin.classList.add("hidden");
            roleRequest.classList.add("hidden");
            adminSection.classList.add("hidden");
            break;

        case 2: /* admin */
            permissionOfficial.classList.remove("denied");
            permissionOfficial.classList.add("granted");
            permissionOfficial.querySelector("#icon").innerText = "check"
            permissionAdmin.classList.remove("hidden");
            roleRequest.classList.add("hidden");
            adminSection.classList.remove("hidden");

            await getPendingEvents();
            await getOfficialRequests();
            break;
        
        default:
            permissionOfficial.classList.add("denied");
            permissionOfficial.classList.remove("granted");
            permissionOfficial.querySelector("#icon").innerText = "lock"
            permissionAdmin.classList.add("hidden");
            roleRequest.classList.remove("hidden");
            adminSection.classList.add("hidden");
    }

    await getMyPublications();
}

async function initAccountPage() {
    user_profile = null;
    const { data:{ session } } = await window.supabaseClient.auth.getSession();
    console.log("session:", session);
    const {  data: subscription } = await window.supabaseClient.auth.onAuthStateChange(async (_event, session) =>
    {
        if (session?.user) {
            const { data: profile, error } = await window.supabaseClient.from('profiles')
                .select("*")
                .eq('id', session.user.id)
                .single();

            if (!error){
                await showAccount(session.user, profile);
                return
            }
            console.error(error);
        }
        showLogin();
    });
  
    return subscription; // (optional) for unsubscribe later
}

function renderMyPublications(event) {
    const eventData = renderEventData(event);

    const html = `
        <div class="event-small-tile" role="link" tabindex="0" data-event-id="${event.id}">
            <div class="event-small-main">
                <span class="event-small-title">${event.title}</span>
                <span class="event-small-meta">
                <span class="event-small-category">${eventData.categoryLabel}</span>
                ·
                <span class="event-small-date">${eventData.date}</span>
                ·
                <span class="event-small-place">${event.location_name}</span>
                </span>
            </div>

            <div class="event-small-actions">
                <button class="event-small-icon-btn delete" aria-label="Supprimer">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        </div>
    
    `
    return html;
}

async function getMyPublications() {
    /* fetch data */
    const { data, error } = await window.supabaseClient
        .from("events") /* fetch also old events from my creation */
        .select("*")
        .eq("created_by", user_profile.id)
        .order("event_date", { ascending: true });

    if (error) {
        console.error(error)
        myEvents.innerText = "ERREUR survenue durant le chargement des évènements";
        return;
    }
    if (!data || data.length === 0) {
        myEvents.innerText = "Pas d'évènements en cours";
        return;
    }
    myEvents.innerHTML = data.map(renderMyPublications).join("")
}

function renderPendingEvents(event) {
    const eventData = renderEventData(event);

    const html = `
        <div class="event-small-tile" role="link" tabindex="0" data-event-id="${event.id}">
            <div class="event-small-main">
                <span class="event-small-title">${event.title}</span>
                <span class="event-small-meta">
                <span class="event-small-category">${eventData.categoryLabel}</span>
                ·
                <span class="event-small-date">${eventData.date}</span>
                ·
                <span class="event-small-place">${event.location_name}</span>
                </span>
            </div>

            <div class="event-small-actions">
                <button class="event-small-icon-btn accept" aria-label="Accepter">
                    <span class="material-symbols-outlined">check_circle</span>
                </button>
                <button class="event-small-icon-btn delete" aria-label="Rejeter">
                    <span class="material-symbols-outlined">cancel</span>
                </button>
            </div>
        </div>
    
    `
    return html;
}

async function getPendingEvents() {
    /* fetch data */
    const { data, error } = await window.supabaseClient
        .from("events")
        .select("*")
        .eq("pending", true)
        .order("event_date", { ascending: true });

    console.log("pending events:", data);

    if (error) {
        console.error(error)
        pendingEvents.innerText = "ERREUR survenue durant le chargement des évènements";
        return;
    }
    if (!data || data.length === 0) {
        pendingEvents.innerText = "Pas d'évènements en attente de publication";
        return;
    }
    
    pendingEvents.innerHTML = data.map(renderPendingEvents).join("")
}

function renderOfficialRequests(profile) {
    const html = `
        <div class="event-small-tile" role="link" tabindex="0" data-profile-id="${profile.id}">
            <div class="event-small-main">
                <span class="event-small-title">${profile.name}</span>
                <span class="event-small-meta">
                <span class="event-small-category">${profile.email}</span>
                </span>
            </div>

            <div class="event-small-actions">
                <button class="event-small-icon-btn accept" aria-label="Accepter">
                    <span class="material-symbols-outlined">check_circle</span>
                </button>
                <button class="event-small-icon-btn delete" aria-label="Rejeter">
                    <span class="material-symbols-outlined">cancel</span>
                </button>
            </div>
        </div>
    
    `
    return html;
}

async function getOfficialRequests() {
    /* fetch data */
    const { data, error } = await window.supabaseClient
        .from("profiles")
        .select("*")
        .eq("official_request", true);

    if (error) {
        console.error(error)
        officialRequests.innerText = "ERREUR survenue durant le chargement des requêtes";
        return;
    }
    if (!data || data.length === 0) {
        officialRequests.innerText = "Pas de requêtes en cours";
        return;
    }
    officialRequests.innerHTML = data.map(renderOfficialRequests).join("")
}

/* === LISTENERS === */

/* Switch login/signup/reset password */
document.getElementById("show-signup").addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("signup-form").reset();
    showSignup();
});

document.getElementById("show-signin").addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById("signin-form").reset();
    showLogin();
});

document.getElementById("reset-password").addEventListener("click", (event) => {
    event.preventDefault();
    showResetPassword();
});

/* Reset password request */
document.getElementById("rstpwd-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const email = form.querySelector("#email").value.trim();
    const button = form.querySelector("#button");

    /* init UI */
    hideErrorNotice();
    button.setAttribute("aria-busy", "true");
    
    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(
        email,
        {
            redirectTo: APP_CONFIG.RESETPWD_REDIRECT_URL
        }
    );

    button.setAttribute("aria-busy", "false");

    if (error) {
        showError(localizeAuthError(error));
        console.error("reset password request failed:", error);
        return;
    }
});

/* Sign-Up */
document.getElementById("signup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const displayName = form.querySelector("#display_name").value.trim();
    const email = form.querySelector("#email").value.trim();
    const password = form.querySelector("#password").value;
    const button = form.querySelector("#button");

    /* init UI */
    hideErrorNotice();
    button.setAttribute("aria-busy", "true");

    const { data, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            emailRedirectTo: APP_CONFIG.EMAILCONFIRMED_REDIRECT_URL,
            data: {
                display_name: displayName
            }
        }
    })

    button.setAttribute("aria-busy", "false");

    if (error) {
        showError(localizeAuthError(error));
        console.error("sign-up failed:", error);
        return;
    }
});

/* Sign-In */
document.getElementById("signin-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const email = form.querySelector("#email").value.trim();
    const password = form.querySelector("#password").value;
    const button = form.querySelector("#button");

    /* init UI */
    hideErrorNotice();
    button.setAttribute("aria-busy", "true");

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    })

    button.setAttribute("aria-busy", "false");

    if (error) {
        showError(localizeAuthError(error));
        console.error("sign-in failed:", error);
        return;
    }
});

/* Logout */
document.getElementById("account-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("loggin out");

    /* init UI */
    hideErrorNotice();

    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
    } catch (err) {
        noticeErrorText.innerText = localizeAuthError(err);
        console.error("sign-out failed:", err);
    }
    user_profile = null;
    document.getElementById("signin-form").reset();
});

/* open official request modal */
document.getElementById("official-role-request").addEventListener("click", (event) => {
    event.preventDefault();
    if (!user_profile) return;

    openRoleRequestModal(user_profile);
});


/* === INITIAL LOAD === */
initAccountPage().catch(console.error);

