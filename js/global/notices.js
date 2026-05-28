const noticeTip = document.getElementById("notice-tip");
const noticeTipTitle = noticeTip.querySelector("#title");
const noticeTipText = noticeTip.querySelector("#text");
const noticeError = document.getElementById("notice-error");
const noticeErrorText = noticeError.querySelector("#text");


export function configNoticeTip(type) {
    noticeTip.classList.forEach(cls => {
        if (cls.startsWith("type-")) {
            noticeTip.classList.remove(cls);
        }
    });
    noticeTip.classList.add(`type-${type}`);
}

export function showNoticeTip(message, title=null) {
    noticeTipText.innerText = message;
    if (title) {
        noticeTipTitle.innerText = title;
        noticeTipTitle.classList.remove("hidden");
    } else {
        noticeTipTitle.classList.add("hidden");
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