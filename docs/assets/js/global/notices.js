const noticeTip = document.getElementById("notice-tip");
const noticeTipTitle = noticeTip.querySelector("#title");
const noticeTipText = noticeTip.querySelector("#text");
const noticeError = document.getElementById("notice-error");
const noticeErrorText = noticeError.querySelector("#text");

export function showNoticeTip(message, title=null) {
    noticeTipText.innerText = message;
    if (title) {
        noticeTipText.classList.remove("hidden");
    } else {
        noticeTipText.classList.add("hidden");
    }
    noticeTip.classList.remove("hidden");
    noticeTip.focus();
}

export function hideNoticeTip() {
    noticeTip.classList.add("hidden");
}

export function showNoticeError(message) {
    noticeErrorText.innerText = message;
    noticeError.classList.remove("hidden");
    noticeError.focus();
}

export function hideNoticeError() {
    noticeError.classList.add("hidden");
}