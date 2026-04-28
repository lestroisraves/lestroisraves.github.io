console.log("executing:", document.currentScript?.src);

/* === VARIABLES === */
let isAuthenticatedLifecycleStarted = false

const rstPwdContainer = document.getElementById("rstpwd-container");
const signInContainer = document.getElementById("signin-container");
const signupContainer = document.getElementById("signup-container");
const accountContainer = document.getElementById("account-container");
const noticeTip = document.getElementById("notice-tip");
const noticeTipText = noticeTip.querySelector("#text");
const noticeError = document.getElementById("notice-error");
const noticeErrorText = noticeError.querySelector("#text");

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

function showAccount(user, profile) {
    const role = profile.role;

    signInContainer.classList.add("hidden");
    rstPwdContainer.classList.add("hidden");
    signupContainer.classList.add("hidden");
    accountContainer.classList.remove("hidden");
    noticeTip.classList.add("hidden");
    hideErrorNotice();

    document.getElementById("account-email").innerText = user.email;
    document.getElementById("account-name").innerText = profile.name;
    document.getElementById("account-role").innerText = APP_CONFIG.ROLES[role];

    /* configure roles */
    const details = document.getElementById("detail-section");
    const publishInstant = details.querySelector("#permission-instant");
    const adminDetails = details.querySelector("#permission-admin");
    const roleRequest = details.querySelector("#role-request");

    switch(role) {
        case 0: /* non official */
            publishInstant.classList.add("denied");
            publishInstant.classList.remove("granted");
            publishInstant.querySelector("#icon").innerText = "lock"
            adminDetails.classList.add("hidden");
            roleRequest.classList.remove("hidden");
            break;
        
        case 1: /* official */
            publishInstant.classList.remove("denied");
            publishInstant.classList.add("granted");
            publishInstant.querySelector("#icon").innerText = "check"
            adminDetails.classList.add("hidden");
            roleRequest.classList.add("hidden");
            break;

        case 2: /* admin */
            publishInstant.classList.remove("denied");
            publishInstant.classList.add("granted");
            publishInstant.querySelector("#icon").innerText = "check"
            adminDetails.classList.remove("hidden");
            roleRequest.classList.add("hidden");
            break;
        
        default:
            publishInstant.classList.add("denied");
            publishInstant.classList.remove("granted");
            publishInstant.querySelector("#icon").innerText = "lock"
            adminDetails.classList.add("hidden");
            roleRequest.classList.remove("hidden");
    }
}

async function initAccountPage() {
    const { data:{ session } } = await window.supabaseClient.auth.getSession();
    console.log("session:", session);
    const {  data: subscription } = await window.supabaseClient.auth.onAuthStateChange(async (_event, session) =>
    {
        if (session?.user) {
            const { data: profile, error } = await window.supabaseClient.from('profiles')
                .select('name, role')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error(error);
                showLogin();
            }
            showAccount(session.user, profile);
        } else {
            showLogin();
        }
    });
  
    return subscription; // (optional) for unsubscribe later
}

/* === LISTENERS === */

/* Switch login/signup/reset password */
document.getElementById("show-signup").addEventListener("click", (event) => {
    event.preventDefault();
    showSignup();
});

document.getElementById("show-signin").addEventListener("click", (event) => {
    event.preventDefault();
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
});

/* === INITIAL LOAD === */
initAccountPage().catch(console.error);

