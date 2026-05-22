console.log("executing:", "eventform.js");

import { openErrorModal } from "./modal.js";
import { tagInput, userTags, clearTags, addTag } from "./tags.js";

/* === VARIABLES === */
const today = startOfDay(new Date());

const form = document.getElementById("event-form");
const categoryList = document.getElementById("category");
const parentalGuideList = document.getElementById("pg");
const priceChoiceList = document.getElementById("price-choice");
const minPrice = document.getElementById("min_price");
const maxPrice = document.getElementById("max_price");
const eventImage = document.getElementById("event-image");
const deleteImageBtn = document.getElementById("remove-image-btn");

let currentImageUrl = null;
let imageToUpload = null;

/* === LOCAL FUNCTIONS === */
async function resizeImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = () => {
            img.src = reader.result;
            showImagePreview(file.name, img.src);
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

function showImagePreview(image_name, image_src) {
    deleteImageBtn.hidden = false;
    form.querySelector(".event-image-wrapper").hidden = false;
    form.querySelector("#event-thumbnail").src = image_src;
    form.querySelector("#file-name").textContent = image_name;
}

/* === EXPORTED FUNCTIONS === */
export function initEventForm(eventData=null) {
    form.reset()
    currentImageUrl = null;
    imageToUpload = null;

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
        opt.innerText = APP_CONFIG.PARENTAL_GUIDE[key]["label"]
        parentalGuideList.appendChild(opt);
    });
    parentalGuideList.value = APP_CONFIG.PARENTAL_GUIDE[0]["label"];

    /* Configure price choice */
    Object.keys(APP_CONFIG.PRICE_CHOICES).forEach(key => {
        const opt = document.createElement("option");
        opt.innerText = APP_CONFIG.PRICE_CHOICES[key]["label"]
        priceChoiceList.appendChild(opt);
    });
    priceChoiceList.value = APP_CONFIG.PRICE_CHOICES[0]["label"];

    /* init userTags */
    clearTags();

    if (!eventData) return;

    /* init form with data */
    form.querySelector("#title").value = eventData.title;
    form.querySelector("#location_name").value = eventData.location_name;
    if (eventData.location_address) form.querySelector("#location_name").value = eventData.location_name;
    if (eventData.long_description) form.querySelector("#long_description").value = eventData.long_description;
    form.querySelector("#category").value = APP_CONFIG.CATEGORIES[eventData.category]["label"];
    form.querySelector("#pg").value = APP_CONFIG.PARENTAL_GUIDE[eventData.pg]["label"];
    form.querySelector("#event_date").value = eventData.event_date;
    if (eventData.event_start_time) form.querySelector("#event_start_time").value = eventData.event_start_time;
    if (eventData.tags) eventData.tags.forEach(t => addTag(t));
    if (eventData.phone) form.querySelector("#phone").value = eventData.phone;
    if (eventData.site_url) form.querySelector("#site_url").value = eventData.site_url;
    if (eventData.to_eat) form.querySelector('input[name="to_eat"]').checked = eventData.to_eat;
    if (eventData.max_price && (eventData.max_price > 0)) {
        priceChoiceList.value = APP_CONFIG.PRICE_CHOICES[2]["label"];
        form.querySelector('#max_price').value = eventData.max_price;
        if (eventData.min_price && (eventData.min_price > 0)) form.querySelector('#min_price').value = eventData.min_price;
    } else {
        if (eventData.is_free_price) {
            priceChoiceList.value = APP_CONFIG.PRICE_CHOICES[1]["label"];
        } else {
            priceChoiceList.value = APP_CONFIG.PRICE_CHOICES[0]["label"];
        }
    }
    priceChoiceList.dispatchEvent(new Event("change", { bubbles: true }));

    if (eventData.image_url) {
        currentImageUrl = eventData.image_url;
        const fileName = currentImageUrl.split("/").pop();
        showImagePreview(fileName, currentImageUrl);
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

export async function handleImageChoice(file) {
    if (file.size > 5_000_000) {
        button.setAttribute("aria-busy", "false");
        openErrorModal("Image trop lourde (5Mo maximum");
        eventImage.value = "";
        return;
    }
    imageToUpload = await resizeImage(file);
}

export async function uploadImageFile() {
    /* check image has changed */
    if (imageToUpload) {
        console.log("upload image");
        const fileName = `event-${crypto.randomUUID()}.jpg`;
        const { data, error } = await window.supabaseClient.storage.from("event-images")
            .upload(fileName, imageToUpload, {
                contentType: "image/jpeg",
                cacheControl: "3600",
                upsert: false
            });
        if (error) {
            return {image_url: null, error: error};
        }
        imageToUpload = null;
        return {image_url: window.supabaseClient.storage.from("event-images").getPublicUrl(fileName).data.publicUrl, error: null};
    } else {
        return {image_url: currentImageUrl, error: null};
    }
}

export function removeImage() {
    imageToUpload = null;
    currentImageUrl = null;
    eventImage.value = "";
    deleteImageBtn.hidden = true;
    form.querySelector(".event-image-wrapper").hidden = true;
    form.querySelector("#event-thumbnail").src = "";
    form.querySelector("#file-name").textContent = "aucun fichier choisi";
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
    const priceChoiceId = getPriceId(priceChoiceList.value);
    var is_free_price = false;
    var min_price = null;
    var max_price = null;
    if (priceChoiceId == 2) {
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
    } else if (priceChoiceId == 1) {
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
        is_test: userTags.includes("is_test"),
        // created_by: done later
        is_free_price: is_free_price,
        min_price: min_price,
        max_price: max_price,
        category: getCategoryId(categoryList.value),
        // image_url: done later
        phone: form.querySelector('#phone').value,
        site_url: form.querySelector('#site_url').value,
        pg: getPgId(parentalGuideList.value),
        to_eat: toEat
    }

    return {payload: payload, nb_days: nb_days}
}


