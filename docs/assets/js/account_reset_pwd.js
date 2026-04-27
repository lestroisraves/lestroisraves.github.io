console.log("executing:", document.currentScript?.src);

/* === VARIABLES === */
const noticeSuccess = document.getElementById("notice-success");
const noticeSuccessText = noticeSuccess.querySelector("#text");
const noticeError = document.getElementById("notice-error");
const noticeErrorText = noticeError.querySelector("#text");

/* === FUNCTIONS === */
function showError(message) {
    noticeError.classList.remove("hidden");
    noticeErrorText.innerText = message;
    noticeError.focus();
}

function showSuccess(message) {
    noticeSuccess.classList.remove("hidden");
    noticeSuccessText.innerText = message;
    noticeSuccess.focus();
}

function hideNoticeMessages() {
    noticeSuccess.classList.add("hidden");
    noticeError.classList.add("hidden");
}

/* === LISTENERS === */

/* RESET PASSWORD  */
document.getElementById("reset-pwd-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const passwordValue = form.querySelector("#password").value;
    const passwordConfirm = form.querySelector("#passwordConfirm");
    const passwordConfirmValue = passwordConfirm.value;
    const button = form.querySelector("#button");

    /* init UI */
    hideNoticeMessages();
    passwordConfirm.setAttribute("aria-invalid", null);
    button.setAttribute("aria-busy", "true");

    if (passwordValue !== passwordConfirmValue) {
        passwordConfirm.setAttribute("aria-invalid", "true");
        button.setAttribute("aria-busy", "false");
        showError("Mots de passes non identiques")
        passwordConfirm.focus();
        return;
    }

    const { error } = await window.supabaseClient.auth.updateUser({
        password: passwordValue
    });

    button.setAttribute("aria-busy", "false");

    if (error) {
        showError(localizeAuthError(error));
        console.error("reset password failed:", error);
        return;
    }

    showSuccess("Mot de passe réinitialisé ! Vous allez être redirigé automatiquement.");

    form.reset();

    setTimeout(() => {
        window.location.href = "../account";
    }, 2000);
});


