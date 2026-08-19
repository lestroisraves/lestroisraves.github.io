console.log("executing:", "account.js");

import {openRoleRequestModal, openProfileModal, openEventModal, openErrorModal, openSuccessModal} from "../global/modal.js?v=af24c378.3d3cbf2";
import { showNoticeTip, showNoticeError, hideNoticeError, hideNoticeTip } from "../global/notices.js?v=af24c378.3d3cbf2";

/* === VARIABLES === */
const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);
let itemId = params.get("id");
let itemType = params.get("type");
history.replaceState(null, "", window.location.pathname + window.location.search);

const loading = document.getElementById("loading-screen");
const signInContainer = document.getElementById("signin-container");
const signInForm = document.getElementById("signin-form");
const signupContainer = document.getElementById("signup-container");
const signUpForm = document.getElementById("signup-form");
const rstPwdContainer = document.getElementById("rstpwd-container");
const rstPwdForm = document.getElementById("rstpwd-form");
const accountContainer = document.getElementById("account-container");

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

const userTypeChoice = document.getElementById("status");

let user_profile = null;
export let selected_profile = null;
export let MY_EVENTS = [];
export let PROFILES = [];
export let PENDING_EVENTS = [];
export let OFFICIAL_REQUESTS = [];

/* === FUNCTIONS === */
async function initAccountPage() {
    user_profile = null;

    /* init user type select */
    Object.keys(APP_CONFIG.USER_STATUS).forEach(key => {
        const opt = document.createElement("option");
        opt.value =key;
        if (APP_CONFIG.USER_STATUS[key]["example"].length > 0) {
            opt.innerText = APP_CONFIG.USER_STATUS[key]["label"] + " (" + APP_CONFIG.USER_STATUS[key]["example"].join(", ") + ", etc...)";
        } else {
            opt.innerText = APP_CONFIG.USER_STATUS[key]["label"];
        }
        userTypeChoice.appendChild(opt);
    });
    
    /* init session */
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
    updateRoleForm.hidden = true;
    const { data, error } = await window.supabaseClient
        .from("profiles") /* fetch also old events from my creation */
        .select("*");

    if (error) {
        console.error(error)
        updateRoleForm.hidden = false;
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
    myEvents.hidden = true;
    myEventsSection.querySelector(".badge").classList.add("none");
    myEventsSection.querySelector(".badge.pending").hidden = true;
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
        myEvents.hidden = false;
        myEventsList.innerText = "Erreur survenue durant le chargement des évènements";
        return;
    }
    if (!data || data.length === 0) {
        return;
    }
    MY_EVENTS = data;
    const pending_events = data.filter(e => e.pending === true);
    if (pending_events.length > 0) {
        myEventsSection.querySelector(".badge.pending").hidden = false;
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
    pendingEvents.hidden = true;
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
        pendingEvents.hidden = false;
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
    officialRequests.hidden = true;
    offReqSection.querySelector(".badge").classList.add("none");
    offReqSection.setAttribute("Disabled", true);
    offReqSection.querySelector(".badge").innerText = 0;

    const { data, error } = await window.supabaseClient
        .from("profiles")
        .select("*")
        .eq("official_request", true);

    if (error) {
        console.error(error)
        officialRequests.hidden = false;
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
        <div class="event-small-tile ${pending}" style="border-color: ${APP_CONFIG.CATEGORIES[eventData.category]["color"]};" role="link" tabindex="0" data-action="${type}" data-${type}-id="${event.id}">
            <div class="event-small-main">
                <span class="event-small-title non-wrap">${event.title}</span>
                <span class="event-small-meta non-wrap">
                    <span style="color: ${APP_CONFIG.CATEGORIES[eventData.category]["color"]};"><strong>${APP_CONFIG.CATEGORIES[eventData.category]["label"]}</strong></span>
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

/* === EXPORTED FUNCTION === */
export function showLogin() {
    signInContainer.querySelector("#signin-form").reset();
    hideNoticeError();
    showNoticeTip("Connectez vous pour publier vos événements et contribuer à l'agenda culturel.");
    rstPwdContainer.hidden = true;
    signupContainer.hidden = true;
    accountContainer.hidden = true;
    signInContainer.hidden = false;
    loading.style.display = "none";
}

export function showSignup() {
    signupContainer.querySelector("#signup-form").reset();
    hideNoticeError();
    showNoticeTip("Créez un compte pour publier vos événements et contribuer à l'agenda culturel.");
    signInContainer.hidden = true;
    rstPwdContainer.hidden = true;
    signupContainer.hidden = false;
    accountContainer.hidden = true;
    loading.style.display = "none";
}

export async function showAccount(user, profile) {
    user_profile = profile;
    console.log("user_profile:", user_profile);

    hideNoticeTip();
    hideNoticeError();

    permissionDetails.innerHTML = renderAccountPermissionDetails();
    document.getElementById("account-email").innerText = user.email;
    document.getElementById("account-name").innerText = profile.name;
    document.getElementById("account-status").innerText = APP_CONFIG.USER_STATUS[user_profile.status]["label"];
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
            permissionAdmin.hidden = true;
            permissionSuperAdmin.hidden = true;
            roleRequest.hidden = false;
            adminSection.hidden = true;
            superAdminSection.hidden = true;
            break;
        
        case 1: /* official */
            permissionOfficial.classList.remove("denied");
            permissionOfficial.classList.add("granted");
            permissionOfficial.querySelector("#icon").innerText = "check"
            permissionAdmin.hidden = true;
            permissionSuperAdmin.hidden = true;
            roleRequest.hidden = true;
            adminSection.hidden = true;
            superAdminSection.hidden = true;
            break;

        case 2:
        case 3: /* moderateur/admin */
            permissionOfficial.classList.remove("denied");
            permissionOfficial.classList.add("granted");
            permissionOfficial.querySelector("#icon").innerText = "check"
            permissionAdmin.hidden = false;
            permissionSuperAdmin.hidden = true;
            roleRequest.hidden = true;
            adminSection.hidden = false;
            superAdminSection.hidden = true;

            await getPendingEvents();
            await getOfficialRequests();

            if (user_profile.role == 3)
            {
                permissionSuperAdmin.hidden = false;
                superAdminSection.hidden = false;

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
            permissionAdmin.hidden = true;
            permissionSuperAdmin.hidden = true;
            roleRequest.hidden = false;
            adminSection.hidden = true;
            superAdminSection.hidden = true;
    }

    await getMyPublications();

    signInContainer.hidden = true;
    rstPwdContainer.hidden = true;
    signupContainer.hidden = true;
    accountContainer.hidden = false;
    loading.style.display = "none";

    if (itemId) {
        var el = null;
        switch (itemType) {
            case "profile":
                el = officialRequestsList.querySelector(`[data-show-profile-id="${itemId}"]`);
                if (!el) return;
                offReqSection.click();
                break;

            case "pendingevent":
                el = pendingEventsList.querySelector(`[data-show-pendingevent-id="${itemId}"]`);
                if (!el) return;
                pendingEventsSection.click();
                break;
            
            case "myevent":
                el = myEventsList.querySelector(`[data-show-myevent-id="${itemId}"]`);
                if (!el) return;
                myEventsSection.click();
                break;
        }
        el.scrollIntoView();
        el.focus();
        el.click();
        itemId = null;
    }
}

export function showResetPassword() {
    rstPwdContainer.querySelector("#rstpwd-form").reset();
    hideNoticeError();
    showNoticeTip("Demandez la réinitialisation de votre mot de passe et vous recevrer un email de:\n" + APP_CONFIG.EMAIL_ADDRESS);
    signInContainer.hidden = true;
    rstPwdContainer.hidden = false;
    signupContainer.hidden = true;
    accountContainer.hidden = true;
    loading.style.display = "none";
}

export async function signup() {
    const displayName = signUpForm.querySelector("#display_name").value.trim();
    const email = signUpForm.querySelector("#email").value.trim();
    const password = signUpForm.querySelector("#password").value;
    const status = parseInt(userTypeChoice.value, 10);
    const button = signUpForm.querySelector("#button");

    /* init UI */
    hideNoticeError();
    button.setAttribute("aria-busy", "true");

    console.log("status", status)

    const { data, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            emailRedirectTo: APP_CONFIG.EMAILCONFIRMED_REDIRECT_URL,
            data: {
                display_name: displayName,
                status: status
            }
        }
    })

    button.setAttribute("aria-busy", "false");

    if (error) {
        showNoticeError(localizeAuthError(error));
        console.error("sign-up failed:", error);
        return;
    }
}

export async function login() {
    const email = signInForm.querySelector("#email").value.trim();
    const password = signInForm.querySelector("#password").value;
    const button = signInForm.querySelector("#button");

    /* init UI */
    hideNoticeError();
    button.setAttribute("aria-busy", "true");

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    })

    button.setAttribute("aria-busy", "false");

    if (error) {
        showNoticeError(localizeAuthError(error));
        console.error("sign-in failed:", error);
        return;
    }
}

export async function logout() {
    console.log("loggin out");

    /* init UI */
    hideNoticeError();

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
    hideNoticeError();
    button.setAttribute("aria-busy", "true");
    
    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(
        email,
        {
            redirectTo: APP_CONFIG.RESETPWD_REDIRECT_URL
        }
    );

    button.setAttribute("aria-busy", "false");

    if (error) {
        showNoticeError(localizeAuthError(error));
        console.error("reset password request failed:", error);
        return;
    }
}

export async function updateProfileRole() {
    const new_role = roleList.value;

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
                    el.click();
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
                    el.click();
                    break;

                case "my-events":
                    el = container.querySelector(`[data-show-myevent-id="${item.id}"]`);
                    if (!el) return;
                    el.scrollIntoView();
                    el.focus();
                    el.click();
                    break;
            }
          
        });

        suggestions.appendChild(span);
    }

    input.classList.add("looking");
    suggestions.classList.remove("hidden");
}

export async function shareEvent(eventId) {
    const event = MY_EVENTS.find(e => e.id === eventId);
    if (!event) return;
    const event_url = `${SITE_URL}#id=${eventId}&type=myevent`;
    const error = await navigatorShareEvent(event, event_url);
    if (error) {
        console.error("Share failed:", error);
        openSuccessModal("Lien vers l'évènement copié !");
    }
}

export async function sharePendingEvent(eventId) {
    const event = PENDING_EVENTS.find(e => e.id === eventId);
    if (!event) return;
    const event_url = `${SITE_URL}/account#id=${eventId}&type=pendingevent`;
    const error = await navigatorShareEvent(event, event_url);
    if (error) {
        console.error("Share failed:", error);
        openSuccessModal("Lien vers l'évènement copié !");
    }
}

export async function shareProfile(profileId) {
    console.log("shareProfile")
    const profile = PROFILES.find(p => p.id === profileId);
    if (!profile) return;
    console.log(profile)
    const profile_url = `${SITE_URL}/account#id=${profileId}&type=profile`;
    const error = await navigatorShareProfile(profile, profile_url);
    if (error) {
        console.error("Share failed:", error);
        openSuccessModal("Lien vers le profile copié !");
    }
}


/* === INITIAL LOAD === */
initAccountPage().catch(console.error);

