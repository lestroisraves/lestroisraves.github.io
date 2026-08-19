console.log("executing:", "account_reset_pwd.js");

import { openSuccessModal } from "../global/modal.js"
import { showNoticeTip, showNoticeError, hideNoticeError } from "../global/notices.js?v=af24c378.3d3cbf2";

/* === VARIABLES === */
const resetPwdForm = document.getElementById("reset-pwd-form");

/* === LOCAL FUNCTIONS === */
function initRstPwdPage(){
    showNoticeTip("ous avez demander à réinitialiser votre mot de passe", "Reinitialisation du mot de passe");
}

async function resetPassword() {
    const passwordValue = resetPwdForm.querySelector("#password").value;
    const passwordConfirm = resetPwdForm.querySelector("#passwordConfirm");
    const passwordConfirmValue = passwordConfirm.value;
    const button = resetPwdForm.querySelector("#button");

    /* init UI */
    hideNoticeError();
    passwordConfirm.setAttribute("aria-invalid", null);
    button.setAttribute("aria-busy", "true");

    if (passwordValue !== passwordConfirmValue) {
        passwordConfirm.setAttribute("aria-invalid", "true");
        button.setAttribute("aria-busy", "false");
        showNoticeError("Mots de passes non identiques")
        passwordConfirm.focus();
        return;
    }

    const { error } = await window.supabaseClient.auth.updateUser({
        password: passwordValue
    });

    button.setAttribute("aria-busy", "false");

    if (error) {
        showNoticeError(localizeAuthError(error));
        console.error("reset password failed:", error);
        return;
    }

    resetPwdForm.reset();
    openSuccessModal("Mot de passe réinitialisé ! Vous allez être redirigé automatiquement.");
    
    setTimeout(() => {
        window.location.href = `../account`;
    }, 3000);
}

/* === INITIAL LOAD === */
initRstPwdPage().catch(console.error);
