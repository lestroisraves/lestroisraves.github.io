console.log("executing:", document.currentScript?.src);

import { openErrorModal, openSuccessModal } from "./modal.js";
import { tagInput, userTags, clearTags } from "./tags.js";

/* === VARIABLES === */
const today = startOfDay(new Date());

const accountContainer = document.getElementById("account-container");
const permissionDetails = document.getElementById("detail-permission");
const submitContainer = document.getElementById("submit-container");
const noticeTip = document.getElementById("notice-tip");
const noticeTipText = noticeTip.querySelector("#text");
const categoryList = document.getElementById("category");
const parentalGuideList = document.getElementById("parental_guide");
const priceChoice = document.getElementById("free-choice");
const minPrice = document.getElementById("min_price");
const maxPrice = document.getElementById("max_price");

let user_profile = null;

/* === FUNCTIONS === */
function initForTest() {
    const form = document.getElementById("event-form");
    form.querySelector("#title").value = "FIP – Festival International de Proximité";
    form.querySelector("#location_name").value = "Rabastens";
    form.querySelector("#location_address").value = null;
    form.querySelector("#long_description").value = "Le Festival International de Proximité (FIP) vous invite à découvrir une programmation riche et variée pour sa 6ème édition, du 22 au 24 mai 2026.\n\nLe Festival International de Proximité (FIP) est un événement culturel unique qui célèbre les arts du cirque et la créativité à Rabastens et ses environs. Créé en 2021, il transforme la ville en une scène vivante chaque année, grâce à des performances artistiques in situ et une équipe de bénévoles passionnés. Le FIP valorise les talents locaux et crée des liens entre artistes, public et habitants. Venez vivre une expérience immersive et découvrir des spectacles captivants lors de ce week-end de mai.\n\nhttps://festival-le-fip.com/";
    form.querySelector("#event_date").value = "2026-05-22";
    form.querySelector("#event_start_time").value = null;
    form.querySelector("#price-choice").value = "Payant";
    form.querySelector("#max_price").value = 40;
    form.querySelector("#min_price").value = 4;
}

function showSubmit(user, profile) {
    user_profile = profile;
    noticeTip.classList.remove("hidden");
    submitContainer.classList.remove("hidden");
    accountContainer.classList.remove("hidden");
    accountContainer.querySelector("#account-role").innerText = APP_CONFIG.ROLES[user_profile.role];

    /* configure roles */
    permissionDetails.innerHTML = renderAccountPermissionDetails();
    const permissionOfficial = accountContainer.querySelector("#permission-official");
    const permissionAdmin = accountContainer.querySelector("#permission-admin");

    switch(user_profile.role) {
        case 0: /* non official */
            permissionOfficial.classList.add("denied");
            permissionOfficial.classList.remove("granted");
            permissionOfficial.querySelector("#icon").innerText = "lock"
            permissionAdmin.classList.add("hidden");
            break;
        
        case 1: /* official */
            permissionOfficial.classList.remove("denied");
            permissionOfficial.classList.add("granted");
            permissionOfficial.querySelector("#icon").innerText = "check"
            permissionAdmin.classList.add("hidden");
            break;

        case 2: /* admin */
            permissionOfficial.classList.remove("denied");
            permissionOfficial.classList.add("granted");
            permissionOfficial.querySelector("#icon").innerText = "check"
            permissionAdmin.classList.remove("hidden");
            break;
        
        default:
            permissionOfficial.classList.add("denied");
            permissionOfficial.classList.remove("granted");
            permissionOfficial.querySelector("#icon").innerText = "lock"
            permissionAdmin.classList.add("hidden");
    }

    /* Configure categories  */
    Object.keys(APP_CONFIG.CATEGORIES).forEach(key => {
        const opt = document.createElement("option");
        opt.innerText = APP_CONFIG.CATEGORIES[key]["label"]
        categoryList.appendChild(opt);
    });
    categoryList.value = APP_CONFIG.CATEGORIES[0]["label"];

    /* Configure parental guide */
    Object.keys(APP_CONFIG.PARENTAL_GUIDE).forEach(key => {
        const opt = document.createElement("option");
        opt.innerText = APP_CONFIG.PARENTAL_GUIDE[key]
        parentalGuideList.appendChild(opt);
    });
    parentalGuideList.value = APP_CONFIG.PARENTAL_GUIDE[0];

    /* init userTags */
    clearTags();

    // initForTest();
}

function showLoginWarning() {
    user_profile = null;
    noticeTip.classList.add("hidden");
    accountContainer.classList.add("hidden");
    submitContainer.classList.add("hidden");
    window.location.href = "../account/";
}

async function initSubmitPage() {
    const session = await getSessionUserProfile();
    if (session?.session?.user && session?.profile) {
        showSubmit(session.session.user, session.profile);
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
    const eventDate = form.querySelector("#event_date")
    const endDate = form.querySelector("#end_date")
    const eventImage = form.querySelector("#event-image");
    const button = form.querySelector("#button");
    const long_description = form.querySelector('#long_description').value
    const start_time = form.querySelector('#event_start_time').value;
    const toEat = form.querySelector('input[name="to_eat"]').checked;

    /* init UI */
    eventDate.setAttribute("aria-invalid", null);
    endDate.setAttribute("aria-invalid", null);
    eventImage.setAttribute("aria-invalid", null);
    minPrice.setAttribute("aria-invalid", null);
    button.setAttribute("aria-busy", "true");

    /* get userTags */
    if (userTags.length > 4) {
        button.setAttribute("aria-busy", "false");
        tagInput.focus();
        openErrorModal("Maximum 4 tags");
        userTags
        return;
    }
    const tags = userTags.map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    
    // check dates
    var nb_days = 1;
    if (new Date(eventDate.value) < today) {
        button.setAttribute("aria-busy", "false");
        eventDate.setAttribute("aria-invalid", true);
        eventDate.focus();
        openErrorModal("La date doit être à partir de aujourd'hui");
        return;
    }

    if (endDate.value) {
        if (new Date(endDate.value) <= new Date(eventDate.value)) {
            button.setAttribute("aria-busy", "false");
            endDate.setAttribute("aria-invalid", true);
            endDate.focus();
            openErrorModal("La date de fin doit être à strictement supérieure à la date de début");
            return;
        }

        nb_days = Math.round((new Date(endDate.value + "T00:00:00") - new Date(eventDate.value + "T00:00:00")) / 86400000) + 1;  // 86400000ms per day
    }

    /* set price */
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
            button.setAttribute("aria-busy", "false");
            minPrice.setAttribute("aria-invalid", true);
            minPrice.focus();
            openErrorModal("Le prix réduit doit être inférieur au prix normal");
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
            button.setAttribute("aria-busy", "false");
            eventImage.setAttribute("aria-invalid", true);
            eventImage.focus();
            openErrorModal("Image trop lourde (5Mo maximum");
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
            openErrorModal("Problème pendant le téléchargement de l'image");
            console.error(error);
            return;
        }
        imageUrl = window.supabaseClient.storage.from("event-images").getPublicUrl(fileName).data.publicUrl;
    }

    for (let day = 0; day < nb_days; day++) {
        const payload = {
            title: form.querySelector('#title').value,
            long_description: long_description === "" ? null : long_description,
            event_date: addDays(eventDate.value, day).toLocaleDateString("fr-CA"),
            event_start_time: start_time === "" ? null : start_time,
            location_name: form.querySelector('#location_name').value,
            location_address: form.querySelector('#location_address').value,
            tags,
            pending: user_profile.role == 0,
            is_test: "is_test" in userTags,
            created_by: user_profile?.id ?? null,
            is_free_price: is_free_price,
            min_price: min_price,
            max_price: max_price,
            category: getCategoryId(categoryList.value),
            image_url: imageUrl,
            phone: form.querySelector('#phone').value,
            site_url: form.querySelector('#site_url').value,
            parental_guide: getPgId(parentalGuideList.value),
            to_eat: toEat
        }
        console.log("submit event payload:", payload)

        const { data: event, error } = await window.supabaseClient.from("events").insert(payload);
        if (error) {
            button.setAttribute("aria-busy", "false");
            if ((nb_days > 1) && (day > 0)) {
                openErrorModal(`Problème de publication (jour ${day+1})\nCependant les premiers jours de l'évènement ont sans doute été publiés`);
            } else {
                openErrorModal("Problème de publication");
            }
            console.error(error);
            return;
        }
    }

    button.setAttribute("aria-busy", "false");
    openSuccessModal("Évènement publié !")
    e.target.reset();
});

/* === INITIAL LOAD === */
initSubmitPage().catch(console.error);

