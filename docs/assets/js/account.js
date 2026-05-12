console.log("executing:", document.currentScript?.src);

import { openEventModal, openProfileModal, openRoleRequestModal, openErrorModal, openSuccessModal, openUpdateRoleModal } from "./modal.js";

/* === VARIABLES === */
let user_profile = null;
let MY_EVENTS = [];
let PROFILES = [];
let selected_profile = null;
let PENDING_EVENTS = [];
let OFFICIAL_REQUESTS = [];

const rstPwdContainer = document.getElementById("rstpwd-container");
const signInContainer = document.getElementById("signin-container");
const signupContainer = document.getElementById("signup-container");
const accountContainer = document.getElementById("account-container");

const noticeTip = document.getElementById("notice-tip");
const noticeTipText = noticeTip.querySelector("#text");
const noticeError = document.getElementById("notice-error");
const noticeErrorText = noticeError.querySelector("#text");

const profileModalContent = document.getElementById("profile-modal-content");
const officialRequestModal = document.getElementById("official-request-modal");

const permissionDetails = document.getElementById("detail-permission");
const myEventsSection = document.getElementById("my-events-section");
const myEvents = document.getElementById("my-events");

const adminSection = document.getElementById("admin-section");
const superAdminSection = document.getElementById("super-admin-section");
const updateRoleSection = document.getElementById("update-role-section");
const updateRoleForm = document.getElementById("update-role-form");
const roleList = document.getElementById("roles");
const updateRoleBtn = document.getElementById("update-role-button");
const userSearchInput = document.getElementById("user-search");
const userSearchSuggestions = document.getElementById("suggestions");

const pendingEventsSection = document.getElementById("pending-events-section");
const offReqSection = document.getElementById("official-req-section");
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

    permissionDetails.innerHTML = renderAccountPermissionDetails();
    document.getElementById("account-email").innerText = user.email;
    document.getElementById("account-name").innerText = profile.name;
    document.getElementById("account-role").innerText = APP_CONFIG.ROLES[user_profile.role];

    /* configure roles */
    const details = document.getElementById("detail-section");
    const permissionOfficial = details.querySelector("#permission-official");
    const permissionAdmin = details.querySelector("#permission-admin");
    const permissionSuperAdmin = details.querySelector("#permission-super-admin");
    const roleRequest = details.querySelector("#role-request");

    switch(user_profile.role) {

        case 0: /* non official */
            permissionOfficial.classList.add("denied");
            permissionOfficial.classList.remove("granted");
            permissionOfficial.querySelector("#icon").innerText = "lock"
            permissionAdmin.classList.add("hidden");
            permissionSuperAdmin.classList.add("hidden");
            roleRequest.classList.remove("hidden");
            adminSection.classList.add("hidden");
            superAdminSection.classList.add("hidden");
            break;
        
        case 1: /* official */
            permissionOfficial.classList.remove("denied");
            permissionOfficial.classList.add("granted");
            permissionOfficial.querySelector("#icon").innerText = "check"
            permissionAdmin.classList.add("hidden");
            permissionSuperAdmin.classList.add("hidden");
            roleRequest.classList.add("hidden");
            adminSection.classList.add("hidden");
            superAdminSection.classList.add("hidden");
            break;

        case 2,3: /* moderateur/admin */
            permissionOfficial.classList.remove("denied");
            permissionOfficial.classList.add("granted");
            permissionOfficial.querySelector("#icon").innerText = "check"
            permissionAdmin.classList.remove("hidden");
            permissionSuperAdmin.classList.add("hidden");
            roleRequest.classList.add("hidden");
            adminSection.classList.remove("hidden");
            superAdminSection.classList.add("hidden");

            await getPendingEvents();
            await getOfficialRequests();

            if (user_profile.role == 3)
            {
                permissionSuperAdmin.classList.remove("hidden");
                superAdminSection.classList.remove("hidden");

                await getProfiles();

                /* configure role select list */
                Object.keys(APP_CONFIG.ROLES).forEach(key => {
                    const opt = document.createElement("option");
                    opt.innerText = APP_CONFIG.ROLES[key]
                    roleList.appendChild(opt);
                });
                roleList.value = APP_CONFIG.ROLES[0];
            }
            break;
        
        default:
            permissionOfficial.classList.add("denied");
            permissionOfficial.classList.remove("granted");
            permissionOfficial.querySelector("#icon").innerText = "lock"
            permissionAdmin.classList.add("hidden");
            permissionSuperAdmin.classList.add("hidden");
            roleRequest.classList.remove("hidden");
            adminSection.classList.add("hidden");
            superAdminSection.classList.add("hidden");
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

function renderProfileModal(profile) {
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
}

function renderEventSmallTile(event, data_action) {
    const eventData = renderEventData(event);

    const pending = eventData.pending
        ? "pending"
        : ""
    
    const html = `
        <div class="event-small-tile cat-${event.category} ${pending}" role="link" tabindex="0" data-action="${data_action}" data-event-id="${event.id}">
            <div class="event-small-main">
                <span class="event-small-title non-wrap">${event.title}</span>
                <span class="event-small-meta non-wrap">
                    <span class="event-small-category cat-${event.category}"><strong>${APP_CONFIG.CATEGORIES[eventData.category]["label"]}</strong></span>
                    .
                    <span>${formatEventDateTime(eventData.event_date)}</span>
                    .
                    <span class="non-wrap">${eventData.location_name}</span>
                </span>
                
            </div>
        </div>
    `
    return html;
}

function renderOfficialRequests(profile) {
    const html = `
        <div class="event-small-tile" role="link" tabindex="0" data-action="show-profile" data-profile-id="${profile.id}">
            <div class="event-small-main">
                <span class="event-small-title non-wrap">${profile.name}</span>
                <span class="event-small-meta">
                    <span">${profile.email}</span>
                </span>
            </div>
        </div>
    `
    return html;
}

async function getProfiles() {
    /* fetch data */
    PROFILES = [];
    selected_profile = null;
    updateRoleForm.classList.add("hidden");
    const { data, error } = await window.supabaseClient
        .from("profiles") /* fetch also old events from my creation */
        .select("*");

    if (error) {
        console.error(error)
        updateRoleForm.classList.remove("hidden");
        updateRoleForm.innerText = "Erreur survenue durant le chargement des utilisateurs";
        return;
    }
    if (!data || data.length === 0) {
        return;
    }
    PROFILES = data;
}

async function getMyPublications() {
    /* fetch data */
    MY_EVENTS = [];
    myEvents.classList.add("hidden");
    myEventsSection.querySelector(".badge").classList.add("none");
    myEventsSection.querySelector(".badge.pending").classList.add("hidden");
    myEventsSection.setAttribute("Disabled", true);
    myEventsSection.querySelector(".badge").innerText = 0;

    const { data, error } = await window.supabaseClient
        .from("events") /* fetch also old events from my creation */
        .select("*")
        .eq("created_by", user_profile.id)
        .order("event_date", { ascending: true });

    if (error) {
        console.error(error)
        myEventsSection.querySelector(".badge").innerText = "?";
        myEvents.classList.remove("hidden");
        myEvents.innerText = "Erreur survenue durant le chargement des évènements";
        return;
    }
    if (!data || data.length === 0) {
        return;
    }
    MY_EVENTS = data;
    const pendingEvents = data.filter(e => e.pending === true);
    if (pendingEvents.length > 0) {
        myEventsSection.querySelector(".badge.pending").classList.remove("hidden");
        myEventsSection.querySelector(".badge.pending .text").innerText = pendingEvents.length;
    }
    myEventsSection.setAttribute("Disabled", false);
    myEventsSection.querySelector(".badge").classList.remove("none");
    myEventsSection.querySelector(".badge").innerText = data.length;
    myEvents.innerHTML = data.map(item => renderEventSmallTile(item, "show-myevent")).join("")
}

async function getPendingEvents() {
    /* fetch data */
    PENDING_EVENTS = [];
    pendingEvents.classList.add("hidden");
    pendingEventsSection.querySelector(".badge").classList.add("none");
    pendingEventsSection.setAttribute("Disabled", true);
    pendingEventsSection.querySelector(".badge").innerText = 0;

    const { data, error } = await window.supabaseClient
        .from("events")
        .select("*")
        .eq("pending", true)
        .order("event_date", { ascending: true });

    console.log("pending events:", data);

    if (error) {
        console.error(error)
        pendingEvents.classList.remove("hidden");
        pendingEventsSection.querySelector(".badge").innerText = "?";
        pendingEvents.innerText = "Erreur survenue durant le chargement des évènements";
        return;
    }
    if (!data || data.length === 0) {
        return;
    }
    PENDING_EVENTS = data;
    pendingEventsSection.setAttribute("Disabled", false);
    pendingEventsSection.querySelector(".badge").classList.remove("none");
    pendingEventsSection.querySelector(".badge").innerText = data.length;
    pendingEvents.innerHTML = data.map(item => renderEventSmallTile(item, "show-pendingevent")).join("")
}

async function getOfficialRequests() {
    /* fetch data */
    OFFICIAL_REQUESTS = [];
    officialRequests.classList.add("hidden");
    offReqSection.querySelector(".badge").classList.add("none");
    offReqSection.setAttribute("Disabled", true);
    offReqSection.querySelector(".badge").innerText = 0;

    const { data, error } = await window.supabaseClient
        .from("profiles")
        .select("*")
        .eq("official_request", true);

    if (error) {
        console.error(error)
        officialRequests.classList.remove("hidden");
        offReqSection.querySelector(".badge").innerText = "?";
        officialRequests.innerText = "Erreur survenue durant le chargement des requêtes";
        return;
    }
    if (!data || data.length === 0) {
        return;
    }

    OFFICIAL_REQUESTS = data;
    offReqSection.setAttribute("Disabled", false);
    offReqSection.querySelector(".badge").classList.remove("none");
    offReqSection.querySelector(".badge").innerText = data.length;
    officialRequests.innerHTML = data.map(renderOfficialRequests).join("")
}

function handleAction(el) {
    const action = el.dataset.action;

    switch (action) {
        case "show-myevent":
            const my_event = MY_EVENTS.find(e => e.id === el.dataset.eventId);
            if (!my_event) return;
            openEventModal(my_event, "my-event");
        break;

        case "show-pendingevent":
            const pending_event = PENDING_EVENTS.find(e => e.id === el.dataset.eventId);
            if (!pending_event) return;
            openEventModal(pending_event, "pending-event");
        break;

        case "show-profile":
            const request_profile = OFFICIAL_REQUESTS.find(e => e.id === el.dataset.profileId);
            if (!request_profile) return;
            renderProfileModal(request_profile);
            openProfileModal(request_profile);
        break;

        default:
            console.warn("Unknown action:", action);
    }
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

document.getElementById("show-signin-from-rst").addEventListener("click", (event) => {
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
    selected_profile = null;
    PROFILES = [];
    MY_EVENTS = [];
    PENDING_EVENTS = [];
    OFFICIAL_REQUESTS = [];
    document.getElementById("signin-form").reset();
    showLogin();
});

/* open official request modal */
document.getElementById("official-role-request").addEventListener("click", (event) => {
    event.preventDefault();
    if (!user_profile) return;

    openRoleRequestModal(user_profile);
});

/* account actions */
document.addEventListener("click", (e) => {
    const el = e.target.closest(".event-small-tile[data-action]");
    if (!el) return;
    handleAction(el);
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;

  const el = e.target.closest(".event-small-tile[data-action]");
  if (!el) return;

  e.preventDefault(); // prevent page scroll on Space
  handleAction(el);
});

myEventsSection.addEventListener("click", (event) => {
    event.preventDefault();
    if (myEventsSection.getAttribute("disabled") === "true") return;

    const isOpen = myEventsSection.getAttribute("aria-expanded") === "true";

    myEventsSection.setAttribute("aria-expanded", String(!isOpen));

    if (isOpen) {
        myEvents.classList.add("hidden");
        myEventsSection.querySelector(".chevron").innerText = "expand_more";
    } else {
        myEvents.classList.remove("hidden");
        myEventsSection.querySelector(".chevron").innerText = "expand_less";
    }
});

/* display super admin actions */
updateRoleSection.addEventListener("click", (event) => {
    event.preventDefault();
    if (updateRoleSection.getAttribute("disabled") === "true") return;

    const isOpen = updateRoleSection.getAttribute("aria-expanded") === "true";

    updateRoleSection.setAttribute("aria-expanded", String(!isOpen));

    if (isOpen) {
        updateRoleForm.classList.add("hidden");
        updateRoleSection.querySelector(".chevron").innerText = "expand_more";

        /* reset form */
        selected_profile = null;
        userSearchInput.value = "";
        updateRoleForm.querySelector("#profile-email").innerText = "-";
        updateRoleForm.querySelector("#profile-name").innerText = "-";
        updateRoleForm.querySelector("#profile-role").innerText = "-";
        roleList.value = APP_CONFIG.ROLES[0];
        updateRoleBtn.disabled = true; 
    } else {
        updateRoleForm.classList.remove("hidden");
        updateRoleSection.querySelector(".chevron").innerText = "expand_less";
    }
});

userSearchInput.addEventListener("input", () => {
    const value = userSearchInput.value.toLowerCase().trim();
    userSearchSuggestions.innerHTML = "";
    selected_profile = null;

    if (value.length < 2) {
        userSearchInput.classList.remove("looking");
        suggestions.classList.add("hidden");
        return;
    }

    const matches = PROFILES.filter(p =>
        p.email.toLowerCase().includes(value)
    ).slice(0, 5); // limit results

    if (matches.length === 0) {
        userSearchInput.classList.remove("looking");
        userSearchSuggestions.classList.add("hidden");
        return;
    }

    for (const profile of matches) {
        const span = document.createElement("span");
        span.textContent = profile.email;
        span.dataset.id = profile.id;

        span.addEventListener("click", () => {
            selected_profile = profile;

            userSearchInput.classList.remove("looking");
            userSearchSuggestions.classList.add("hidden");

            userSearchInput.value = "";
            updateRoleForm.querySelector("#profile-email").innerText = profile.email;
            updateRoleForm.querySelector("#profile-name").innerText = profile.name;
            updateRoleForm.querySelector("#profile-role").innerText = APP_CONFIG.ROLES[profile.role];
            roleList.value = APP_CONFIG.ROLES[profile.role];
            updateRoleBtn.disabled = false;
        });

        userSearchSuggestions.appendChild(span);
    }

    userSearchInput.classList.add("looking");
    userSearchSuggestions.classList.remove("hidden");
});

updateRoleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;

    const new_role = getRoleId(roleList.value);

    if (!selected_profile || (new_role == selected_profile.role)) {
        return;
    }

    console.log("updating profile role:", selected_profile.id, new_role);
    const { error } = await window.supabaseClient
        .from("profiles")
        .update({
            role: new_role
        })
        .eq("id", selected_profile.id);

    if (error) {
        openErrorModal("Un problème est survenu");
        return;
    }

    openSuccessModal("Profile mis à jour ! La page va se rafraichir automatiquement.");

    setTimeout(function () {
        window.location.reload();
    }, 3000);
});

/* display admin request lists */
offReqSection.addEventListener("click", (event) => {
    event.preventDefault();
    if (offReqSection.getAttribute("disabled") === "true") return;

    const isOpen = offReqSection.getAttribute("aria-expanded") === "true";

    offReqSection.setAttribute("aria-expanded", String(!isOpen));

    if (isOpen) {
        officialRequests.classList.add("hidden");
        offReqSection.querySelector(".chevron").innerText = "expand_more";
    } else {
        officialRequests.classList.remove("hidden");
        offReqSection.querySelector(".chevron").innerText = "expand_less";
    }
});

pendingEventsSection.addEventListener("click", (event) => {
    event.preventDefault();
    if (pendingEventsSection.getAttribute("disabled") === "true") return;

    const isOpen = pendingEventsSection.getAttribute("aria-expanded") === "true";

    pendingEventsSection.setAttribute("aria-expanded", String(!isOpen));

    if (isOpen) {
        pendingEvents.classList.add("hidden");
        pendingEventsSection.querySelector(".chevron").innerText = "expand_more";
    } else {
        pendingEvents.classList.remove("hidden");
        pendingEventsSection.querySelector(".chevron").innerText = "expand_less";
    }
});


/* === INITIAL LOAD === */
initAccountPage().catch(console.error);

