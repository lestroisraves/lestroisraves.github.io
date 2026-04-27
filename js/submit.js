console.log("executing:", document.currentScript?.src);

/* === VARIABLES === */
const accountContainer = document.getElementById("account-container");
const submitContainer = document.getElementById("submit-container");
const noticeTip = document.getElementById("notice-tip");
const noticeTipText = noticeTip.querySelector("#text");
const noticeSuccess = document.getElementById("notice-success");
const noticeSuccessText = noticeSuccess.querySelector("#text");
const noticeError = document.getElementById("notice-error");
const noticeErrorText = noticeError.querySelector("#text");
const categoryList = document.getElementById("category");
const priceChoice = document.getElementById("free-choice");
const minPrice = document.getElementById("min_price");
const maxPrice = document.getElementById("max_price");

/* === FUNCTIONS === */
function initForTest() {
    const form = document.getElementById("event-form");
    form.querySelector("#title").value = "FIP – Festival International de Proximité";
    form.querySelector("#location_name").value = "Rabastens";
    form.querySelector("#location_address").value = null;
    form.querySelector("#long_description").value = "Le Festival International de Proximité (FIP) vous invite à découvrir une programmation riche et variée pour sa 6ème édition, du 22 au 24 mai 2026.\n\nLe Festival International de Proximité (FIP) est un événement culturel unique qui célèbre les arts du cirque et la créativité à Rabastens et ses environs. Créé en 2021, il transforme la ville en une scène vivante chaque année, grâce à des performances artistiques in situ et une équipe de bénévoles passionnés. Le FIP valorise les talents locaux et crée des liens entre artistes, public et habitants. Venez vivre une expérience immersive et découvrir des spectacles captivants lors de ce week-end de mai.\n\nhttps://festival-le-fip.com/";
    form.querySelector("#event_date").value = "2026-05-22";
    form.querySelector("#event_start_time").value = null;
    form.querySelector("#tags").value = "cirque, concert, enfants, festival";
    form.querySelector("#price-choice").value = "Payant";
    form.querySelector("#max_price").value = 40;
    form.querySelector("#min_price").value = 4;
}

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

function showSubmit(user, profile) {
    const role = profile.role;
    noticeTip.classList.remove("hidden");
    submitContainer.classList.remove("hidden");
    accountContainer.classList.remove("hidden");
    hideNoticeMessages();

    accountContainer.querySelector("#account-role").innerText = APP_CONFIG.ROLES[role]["label"];

    /* configure roles */
    const publishInstant = accountContainer.querySelector("#permission-instant");
    const adminDetails = accountContainer.querySelector("#permission-admin");
    const roleRequest = accountContainer.querySelector("#role-request");

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

    // initForTest();
}

function showLoginWarning() {
    noticeTip.classList.add("hidden");
    accountContainer.classList.add("hidden");
    submitContainer.classList.add("hidden");
    hideNoticeMessages();

    window.location.href = "../account/";
}

async function initSubmitPage() {
    const { data:{ session } } = await window.supabaseClient.auth.getSession();
    console.log("session:", session);
    if (session?.user) {
        const { data: profile, error } = await window.supabaseClient.from('profiles')
            .select('name, role')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error(error);
            showLoginWarning();
        }
        showSubmit(session.user, profile);
    } else {
        showLoginWarning();
    }
}

function resizeImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = () => {
            img.src = reader.result;
        };

        img.onload = () => {
            const scale = Math.min(1, maxWidth / img.width);
            const canvas = document.createElement("canvas");

            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (blob) => resolve(blob),
                "image/jpeg",
                quality
            );
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* === LISTENERS === */
document.getElementById('price-choice').addEventListener("change", (event) => {
    console.log("Selected:", event.target);
    if (event.target.value == "Payant") {
        minPrice.disabled = false;
        maxPrice.disabled = false;
    }
    else
    {
        minPrice.disabled = true;
        minPrice.value = "0.00";
        maxPrice.disabled = true;
        maxPrice.value = "0.00";
    }
});


document.getElementById("event-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const eventImage = form.querySelector("#event-image");
    const button = form.querySelector("#button");

    /* init UI */
    hideNoticeMessages();
    eventImage.setAttribute("aria-invalid", null);
    minPrice.setAttribute("aria-invalid", null);
    button.setAttribute("aria-busy", "true");

    /* get user info */
    const {data: { user },} = await window.supabaseClient.auth.getUser();
    console.log("user?", !!user, user?.id);

    /* get data */
    const tags = form
        .querySelector("#tags")
        .value.split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

    const start_time = form.querySelector('#event_start_time').value;

    const priceChoice = form.querySelector('#price-choice').value.trim().toLowerCase();
    console.log("priceChoice:", priceChoice)
    var is_free_price = false;
    var min_price = null;
    var max_price = null;
    if (priceChoice == "payant") {
        min_price = minPrice.value.trim() === "" ? null: Number(minPrice.value);
        max_price = maxPrice.value.trim() === "" ? null: Number(maxPrice.value);
        if (min_price && max_price && (min_price > max_price))
        {
            minPrice.setAttribute("aria-invalid", "true");
            button.setAttribute("aria-busy", "false");
            showError("Le prix réduit doit être inférieur au prix normal");
            return;
        }
    } else if (priceChoice == "participation libre") {
        is_free_price = true;
    }

    /* get image */
    const file = eventImage.files[0];
    let imageUrl = null;
    
    if (file) {
        
        if (file.size > 5_000_000) {
            eventImage.setAttribute("aria-invalid", "true");
            showError("Image trop lourde (5Mo maximum");
            button.setAttribute("aria-busy", "false");
            return;
        }

        const resizedBlob = await resizeImage(file);
        const fileName = `event-${crypto.randomUUID()}.jpg`;
        const { data, error } = await window.supabaseClient.storage.from("event-images")
            .upload(fileName, resizedBlob, {
                contentType: "image/jpeg",
                cacheControl: "3600",
                upsert: false
            });
        if (error) {
            button.setAttribute("aria-busy", "false");
            showError("Problème pendant le téléchargement de l'image");
            console.error(error);
            return;
        }
        imageUrl = window.supabaseClient.storage.from("event-images").getPublicUrl(fileName).data.publicUrl;
    }

    const payload = {
        title: form.querySelector('#title').value,
        long_description: form.querySelector('#long_description').value,
        event_date: form.querySelector('#event_date').value,
        event_start_time: start_time === "" ? null : start_time,
        location_name: form.querySelector('#location_name').value,
        location_address: form.querySelector('#location_address').value,
        tags,
        pending: false,
        is_anonymous: !user,
        created_by: user?.id ?? null,
        is_free_price: is_free_price,
        min_price: min_price,
        max_price: max_price,
        category: getCategoryId(categoryList.value),
        image_url: imageUrl
    }
    console.log("submit payload:", payload)

    const { data: event, error } = await window.supabaseClient.from("events").insert(payload);

    button.setAttribute("aria-busy", "false");

    if (error) {
        showError("Problème de publication");
        console.error(error);
        return;
    }

    showSuccess("Évènement publié !")
    e.target.reset();
});

/* === INITIAL LOAD === */
initSubmitPage().catch(console.error);

