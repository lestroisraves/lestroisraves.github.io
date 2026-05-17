console.log("executing:", document.currentScript?.src);

import { openErrorModal } from "./modal.js";
import { tagInput, userTags, clearTags } from "./tags.js";

/* === VARIABLES === */
const today = startOfDay(new Date());

const form = document.getElementById("event-form");
const categoryList = document.getElementById("category");
const parentalGuideList = document.getElementById("parental_guide");
const priceChoice = document.getElementById("free-choice");
const minPrice = document.getElementById("min_price");
const maxPrice = document.getElementById("max_price");
const eventImage = document.getElementById("event-image");

let currentImage = null;

/* === LOCAL FUNCTIONS === */
async function resizeImage(file, maxWidth = 1200, quality = 0.8) {
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

/* === EXPORTED FUNCTIONS === */
export function initEventForm(eventData=null) {
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

    if (!eventData) return;

    /* init form with data */
    form.querySelector("#title").value = eventData.title;

    if (eventData.image_url) {
        form.querySelector(".event-image-wrapper").classList.remove("hidden");
        form.querySelector("#event-thumbnail").src = eventData.image_url;
    }
}

export function priceChanged(target) {
    if (target.value == "Payant") {
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
}

export function showImagePreview(file) {
    if (file.size > 5_000_000) {
        button.setAttribute("aria-busy", "false");
        openErrorModal("Image trop lourde (5Mo maximum");
        eventImage.value = "";
        return;
    }
    currentImage = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        form.querySelector(".event-image-wrapper").classList.remove("hidden");
        form.querySelector("#event-thumbnail").src = e.target.result;
        form.querySelector("#file-name").textContent = file.name;
    };
    reader.readAsDataURL(currentImage);
}

export async function uploadImageFile() {
    /* get image */
    const file = eventImage.files[0];
    if (!file) return null
        
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
        return null;
    }

    return window.supabaseClient.storage.from("event-images").getPublicUrl(fileName).data.publicUrl;

}

export function getEventFormPayload() {
    const eventDate = form.querySelector("#event_date")
    const endDate = form.querySelector("#end_date")
    
    const button = form.querySelector("#button");
    const long_description = form.querySelector('#long_description').value
    const start_time = form.querySelector('#event_start_time').value;
    const toEat = form.querySelector('input[name="to_eat"]').checked;

    /* init UI */
    eventDate.setAttribute("aria-invalid", null);
    endDate.setAttribute("aria-invalid", null);
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

    const payload = {
        title: form.querySelector('#title').value,
        long_description: long_description === "" ? null : long_description,
        // event_date: done later
        event_start_time: start_time === "" ? null : start_time,
        location_name: form.querySelector('#location_name').value,
        location_address: form.querySelector('#location_address').value,
        tags,
        // pending: done later
        is_test: "is_test" in userTags,
        // created_by: done later
        is_free_price: is_free_price,
        min_price: min_price,
        max_price: max_price,
        category: getCategoryId(categoryList.value),
        // image_url: done later
        phone: form.querySelector('#phone').value,
        site_url: form.querySelector('#site_url').value,
        parental_guide: getPgId(parentalGuideList.value),
        to_eat: toEat
    }

    return {payload: payload, nb_days: nb_days}
}


