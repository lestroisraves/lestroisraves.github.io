console.log("executing:", document.currentScript?.src);

import {openRoleRequestModal, openProfileModal, openEventModal, openErrorModal, openSuccessModal} from "../global/modal.js";

/* === VARIABLES === */
let user_profile = null;
export let selected_profile = null;
export let MY_EVENTS = [];
export let PROFILES = [];
export let PENDING_EVENTS = [];
export let OFFICIAL_REQUESTS = [];

const signInContainer = document.getElementById("signin-container");
const signInForm = document.getElementById("signin-form");
const signupContainer = document.getElementById("signup-container");
const signUpForm = document.getElementById("signup-form");
const rstPwdContainer = document.getElementById("rstpwd-container");
const rstPwdForm = document.getElementById("rstpwd-form");
const accountContainer = document.getElementById("account-container");

const noticeTip = document.getElementById("notice-tip");
const noticeTipText = noticeTip.querySelector("#text");
const noticeError = document.getElementById("notice-error");
const noticeErrorText = noticeError.querySelector("#text");

const permissionDetails = document.getElementById("detail-permission");
const adminSection = document.getElementById("admin-section");
const superAdminSection = document.getElementById("super-admin-section");

const updateRoleForm = document.getElementById("update-role-form");
const roleList = document.getElementById("roles");

const offReqSection = document.getElementById("official-req-section");
const officialRequests = document.getElementById("official-requests");
const officialRequestsList = document.getElementById("official-requests-list");

const pendingEventsSection = document.getElementById("pending-events-section");
const pendingEvents = document.getElementById("pending-events");
const pendingEventsList = document.getElementById("pending-events-list");

const myEventsSection = document.getElementById("my-events-section");
const myEvents = document.getElementById("my-events");
const myEventsList = document.getElementById("my-events-list");

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

function searchMatches(item, value, container) {
    switch(container) {
        case "official-requests":
        case "update-role-form":
            return item.email.toLowerCase().includes(value);

        case "pending-events":
        case "my-events":
            return item.title.toLowerCase().includes(value);
            break;
    }
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
        myEventsList.innerText = "Erreur survenue durant le chargement des évènements";
        return;
    }
    if (!data || data.length === 0) {
        return;
    }
    MY_EVENTS = data;
    const pending_events = data.filter(e => e.pending === true);
    if (pending_events.length > 0) {
        myEventsSection.querySelector(".badge.pending").classList.remove("hidden");
        myEventsSection.querySelector(".badge.pending .text").innerText = pending_events.length;
    }
    myEventsSection.setAttribute("Disabled", false);
    myEventsSection.querySelector(".badge").classList.remove("none");
    myEventsSection.querySelector(".badge").innerText = data.length;
    myEventsList.innerHTML = data.map(item => renderEventSmallTile(item, "show-myevent")).join("")
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

    if (error) {
        console.error(error)
        pendingEvents.classList.remove("hidden");
        pendingEventsSection.querySelector(".badge").innerText = "?";
        pendingEventsList.innerText = "Erreur survenue durant le chargement des évènements";
        return;
    }
    if (!data || data.length === 0) {
        return;
    }
    PENDING_EVENTS = data;
    pendingEventsSection.setAttribute("Disabled", false);
    pendingEventsSection.querySelector(".badge").classList.remove("none");
    pendingEventsSection.querySelector(".badge").innerText = data.length;
    pendingEventsList.innerHTML = data.map(item => renderEventSmallTile(item, "show-pendingevent")).join("")
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
        officialRequestsList.innerText = "Erreur survenue durant le chargement des requêtes";
        return;
    }
    if (!data || data.length === 0) {
        return;
    }

    OFFICIAL_REQUESTS = data;
    offReqSection.setAttribute("Disabled", false);
    offReqSection.querySelector(".badge").classList.remove("none");
    offReqSection.querySelector(".badge").innerText = data.length;
    officialRequestsList.innerHTML = data.map(renderOfficialRequests).join("")
}

function renderEventSmallTile(event, type) {
    const eventData = renderEventData(event);

    const pending = eventData.pending
        ? "pending"
        : ""
    
    const html = `
        <div class="event-small-tile cat-${event.category} ${pending}" role="link" tabindex="0" data-action="${type}" data-${type}-id="${event.id}">
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
        <div class="event-small-tile" role="link" tabindex="0" data-action="show-profile" data-show-profile-id="${profile.id}">
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

/* === EXPORTED FUNCTION === */
export function showLogin() {
    signInContainer.classList.remove("hidden");
    rstPwdContainer.classList.add("hidden");
    signupContainer.classList.add("hidden");
    accountContainer.classList.add("hidden");
    signInContainer.querySelector("#signin-form").reset();
    hideErrorNotice();
    showNoticeTip("Connectez vous pour publier vos événements et contribuer à l'agenda culturel.");
}

export function showSignup() {
    signInContainer.classList.add("hidden");
    rstPwdContainer.classList.add("hidden");
    signupContainer.classList.remove("hidden");
    accountContainer.classList.add("hidden");
    signupContainer.querySelector("#signup-form").reset();
    hideErrorNotice();
    showNoticeTip("Créez un compte pour publier vos événements et contribuer à l'agenda culturel.");
}

export async function showAccount(user, profile) {
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

        case 2:
        case 3: /* moderateur/admin */
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

export function showResetPassword() {
    signInContainer.classList.add("hidden");
    rstPwdContainer.classList.remove("hidden");
    signupContainer.classList.add("hidden");
    accountContainer.classList.add("hidden");
    rstPwdContainer.querySelector("#rstpwd-form").reset();
    hideErrorNotice();
    showNoticeTip("Demandez la réinitialisation de votre mot de passe et vous recevrer un email de:\n" + APP_CONFIG.EMAIL_ADDRESS);
}

export async function signup() {
    const displayName = signUpForm.querySelector("#display_name").value.trim();
    const email = signUpForm.querySelector("#email").value.trim();
    const password = signUpForm.querySelector("#password").value;
    const button = signUpForm.querySelector("#button");

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
}

export async function login() {
    const email = signInForm.querySelector("#email").value.trim();
    const password = signInForm.querySelector("#password").value;
    const button = signInForm.querySelector("#button");

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
}

export async function logout() {
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
    showLogin();
}

export async function sendResetPasswordRequest() {
    const email = rstPwdForm.querySelector("#email").value.trim();
    const button = rstPwdForm.querySelector("#button");

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
}

export async function updateProfileRole() {
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
}

export function openRoleRequest() {
    if (!user_profile) return;
    openRoleRequestModal(user_profile);
}

export function openPendingEvent(eventId) {
    const event = PENDING_EVENTS.find(e => e.id === eventId);
    if (!event) return;
    openEventModal(event, "pending-event");
}

export function openMyEvent(eventId) {
    const event = MY_EVENTS.find(e => e.id === eventId);
    if (!event) return;
    openEventModal(event, "my-event");
}

export function openProfile(profileId) {
    const profile = OFFICIAL_REQUESTS.find(e => e.id === profileId);
    if (!profile) return;
    openProfileModal(profile);
}

export function searchInput(input) {
    const container = input.closest(".accordion-container");
    const suggestions = container.querySelector(".suggestions");

    const value = input.value.toLowerCase().trim();
    suggestions.innerHTML = "";
    selected_profile = null;
    var data_list = [];

    switch(container.id) {
        case "official-requests":
            data_list = OFFICIAL_REQUESTS;
            break;

        case "update-role-form":
            data_list = PROFILES;
            break;

        case "pending-events":
            data_list = PENDING_EVENTS;
            break;

        case "my-events":
            data_list = MY_EVENTS;
            break;
    }

    if (value.length < 2) {
        input.classList.remove("looking");
        suggestions.classList.add("hidden");
        return;
    }

    const matches = data_list.filter(i => 
        searchMatches(i, value, container.id)
    ).slice(0, 5); // limit results

    if (matches.length === 0) {
        input.classList.remove("looking");
        suggestions.classList.add("hidden");
        return;
    }

    for (const item of matches) {
        const span = document.createElement("span");
        span.dataset.id = item.id;
        span.textContent = "";
        switch(container.id) {
            case "official-requests":
            case "update-role-form":
                span.textContent = item.email;
                break;

            case "pending-events":
            case "my-events":
                span.textContent = item.title;
                break;

        }
        
        span.addEventListener("click", () => {
            input.classList.remove("looking");
            suggestions.classList.add("hidden");
            input.value = "";
            var el = null;

            switch(container.id) {
                case "official-requests":
                    el = container.querySelector(`[data-show-profile-id="${item.id}"]`);
                    if (!el) return;
                    el.scrollIntoView();
                    el.focus();
                    break;

                case "update-role-form":
                    selected_profile = item;
                    container.querySelector("#profile-email").innerText = item.email;
                    container.querySelector("#profile-name").innerText = item.name;
                    container.querySelector("#profile-role").innerText = APP_CONFIG.ROLES[item.role];
                    container.querySelector("#roles").value = APP_CONFIG.ROLES[item.role];
                    container.querySelector("#update-role-button").disabled = false;
                    break;

                case "pending-events":
                    el = container.querySelector(`[data-show-pendingevent-id="${item.id}"]`);
                    if (!el) return;
                    el.scrollIntoView();
                    el.focus();
                    break;

                case "my-events":
                    el = container.querySelector(`[data-show-myevent-id="${item.id}"]`);
                    if (!el) return;
                    el.scrollIntoView();
                    el.focus();
                    break;
            }
          
        });

        suggestions.appendChild(span);
    }

    input.classList.add("looking");
    suggestions.classList.remove("hidden");
}


/* === INITIAL LOAD === */
initAccountPage().catch(console.error);

