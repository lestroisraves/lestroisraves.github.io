console.log("executing:", "helper.js");

/* === ERRORS/MESSAGES === */
function localizeAuthError(error) {
  // error is typically an object with { name, message, code, status, ... }
  const code = error?.code || error?.name;

  const dict = {
    // common examples (codes vary by case/provider)
    "invalid_credentials": "Email ou mot de passe incorrect.",
    "invalid_grant": "Connexion impossible. Veuillez réessayer.",
    "user_already_exists": "Un compte existe déjà avec cet email.",
    "weak_password": "Mot de passe trop faible. Utilisez au moins 8 caractères.",
    "email_not_confirmed": "Veuillez confirmer votre email avant de vous connecter.",
  };
  console.log("ERROR:", code)

  // Fallback to message but keep it user-friendly
  return dict[code] || "Une erreur est survenue. Veuillez réessayer.";
}

/* === DATA HELPER === */
function getCategoryId(label) {
    var id = 4;
    Object.keys(APP_CONFIG.CATEGORIES).forEach(key => {
        if (label == APP_CONFIG.CATEGORIES[key]["label"])
        {
            id = key;
            return;
        }
    });
    return id;
}

function getAreaId(label) {
    var id = 0;
    Object.keys(APP_CONFIG.AREAS).forEach(key => {
        if (label == APP_CONFIG.AREAS[key]["label"])
        {
            id = key;
            return;
        }
    });
    return id;
}

function getRoleId(label) {
    var id = 0;
    Object.keys(APP_CONFIG.ROLES).forEach(key => {
        if (label == APP_CONFIG.ROLES[key])
        {
            id = key;
            return;
        }
    });
    return id;
}

function getPgId(label) {
    var id = 0;
    Object.keys(APP_CONFIG.PARENTAL_GUIDE).forEach(key => {
        if (label == APP_CONFIG.PARENTAL_GUIDE[key]["label"])
        {
            id = key;
            return;
        }
    });
    return id;
}

function getPriceId(label) {
    var id = 0;
    Object.keys(APP_CONFIG.PRICE_CHOICES).forEach(key => {
        if (label == APP_CONFIG.PRICE_CHOICES[key]["label"])
        {
            id = key;
            return;
        }
    });
    return id;
}


/* === HTML RENDERING === */
function renderMaterialIconText(icon, text) {
    return `<span class="event-icon-text">
                <span class="material-symbols-outlined">${icon}</span>
                <span class="text">${text}</span>
            </span>
            `
}

function linkify(text) {
    const urlRegex = /(\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+)/gi;

    return text.replace(urlRegex, (url) => {
        const href = url.startsWith("http")
            ? url
            : `https://${url}`;

        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
}

/* === DATE & TIME === */
function formatDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function formatDateForUI(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function formatTimeForUI(timeString) {
    return timeString.slice(0, 5);  // "18:30:45" => "18:30"
}

function formatEventDate(dateStr) {
    const date = new Date(dateStr);
    var formattedDate = date.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short"
    });

    // Capitalize first letter (Vendredi…)
    return `<strong>${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}</strong>`;
}

function formatEventDateTime(dateStr, timeStr) {
    var formattedDate = formatEventDate(dateStr);

    // Build final string
    if (timeStr) {
        // assume "18:30:45" => "18:30"
        const [hour, min] = timeStr.slice(0, 5).split(":");
        if (min == "00") {
            formattedDate += ` - ${hour}h`;
        } else {
            formattedDate += ` - ${hour}h${min}`;
        }
        
    }

  return formattedDate;
}

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getSunday(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Sun) → 6 (Sat)
    const diff = (7 - day) % 7;
    d.setDate(d.getDate() + diff);
    return startOfDay(d);
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return startOfDay(d);
}

function sortByDate(events) {
    return events.sort(
        (a, b) =>
            new Date(a.event_date) - new Date(b.event_date)
    );
}

function formatDateRange(startDate, endDate) {
    if (startDate.toLocaleDateString() == endDate.toLocaleDateString()) {
        /* this week sunday == tomorrow */
        return `Demain ${formatEventDate(startDate)}`;
    } else {
        return `Du ${formatEventDate(startDate)} au ${formatEventDate(endDate)}`;
    }
}

function renderAccountPermissionDetails() {
    return `
        <div class="detail-section-list">
            <div class="permission granted">
                <span id="icon" class="material-symbols-outlined">check</span>
                Publier des évènements
            </div>
            <div class="permission granted">
                <span id="icon" class="material-symbols-outlined">check</span>
                Editer vos évènements
            </div>
            <div id="permission-official" class="permission denied">
                <span id="icon" class="material-symbols-outlined">lock</span>
                Publier instantanément (sans délais de 3 jours)
            </div>
        </div>
        <div id="permission-admin" class="detail-section-list hidden">
            <div class="permission granted">
                <span id="icon" class="material-symbols-outlined">check</span>
                Modération: accepter/refuser une nouvelle publication
            </div>
            <div class="permission granted">
                <span id="icon" class="material-symbols-outlined">check</span>
                Modération: accepter/refuser une requête contributeur "Officiel"
            </div>
            <div class="permission granted">
                <span id="icon" class="material-symbols-outlined">check</span>
                Modération: supprimer n'importe quel évènement
            </div>
        </div>
        <div id="permission-super-admin" class="detail-section-list hidden">
            <div class="permission granted">
                <span id="icon" class="material-symbols-outlined">check</span>
                <span >Admin: Changer le role d'un contributeur</span>
            </div>
        </div>
    `
}

function setEventImage(container, url) {
    const img = container.querySelector(".event-thumbnail");
    const placeholder = container.querySelector(".image-placeholder");

    // Reset state BEFORE changing src
    img.classList.remove("loaded");
    placeholder.style.display = "flex";  // show loading

    // Set new image
    img.src = url;

    // When image is loaded
    img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;

        const container = img.parentElement;
        container.style.aspectRatio = ratio;

        img.classList.add("loaded");
        placeholder.style.display = "none";
    };

    // Handle error
    // img.onerror = () => {
    //     placeholder.textContent = "image";
    // };
}


function renderEventData(event, details = false) {
    const eventData = event;

    eventData.categoryHtml = `
        <div class="event-meta category cat-${eventData.category}" style="color: ${APP_CONFIG.CATEGORIES[eventData.category]["color"]};">
            ${renderMaterialIconText(APP_CONFIG.CATEGORIES[eventData.category]["icon"], APP_CONFIG.CATEGORIES[eventData.category]["label"])}
        </div>
    `
    eventData.locationHtml = `
        <span class="event-icon-text">
            <span class="material-symbols-outlined">place</span>
            <span class="text"><strong>${eventData.location_name}</strong></span>
        </span>
    `

    eventData.tagsHtml = eventData.tags && eventData.tags.length
        ? `<div class="event-tags">${eventData.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div>`
        : "";

    eventData.priceLabel = APP_CONFIG.PRICE_CHOICES[eventData.price]["label"];
    if (eventData.price == 2) {
        if (eventData.min_price) {
            eventData.priceLabel = eventData.min_price + " à " + eventData.max_price + " €";
        } else  {
            eventData.priceLabel = eventData.max_price + " €";
        }
    }
    
    switch (eventData.pg)
    {
        case 0:
            eventData.parentalGuideHtml = renderMaterialIconText(APP_CONFIG.PARENTAL_GUIDE[0]["icon"], APP_CONFIG.PARENTAL_GUIDE[0]["label"]);
            break;

        case 1:
            eventData.parentalGuideHtml = renderMaterialIconText(APP_CONFIG.PARENTAL_GUIDE[1]["icon"], APP_CONFIG.PARENTAL_GUIDE[1]["label"]);
            break;

        case 2:
            eventData.parentalGuideHtml = renderMaterialIconText(APP_CONFIG.PARENTAL_GUIDE[2]["icon"], APP_CONFIG.PARENTAL_GUIDE[2]["label"]);
            break;
    }

    if (details) {
        // render extra information for event modal
        eventData.addressHtml = eventData.location_address
            ? `<div class="event-meta">
                    ${renderMaterialIconText("distance", eventData.location_address)}
               </div>`
            : "";

        eventData.phoneHtml = eventData.phone
            ? `<div class="event-meta">
                    ${renderMaterialIconText("call", eventData.phone)}
               </div>`
            : "";

        eventData.siteUrlHtml = eventData.site_url
            ? `<div class="event-meta">
                    ${renderMaterialIconText("language", linkify(eventData.site_url))}
               </div>`
            : "";

        eventData.eatHtml = eventData.to_eat
            ? `<div class="event-meta">
                    ${renderMaterialIconText("fork_spoon", "À manger sur place")}
               </div>`
            : "";

        eventData.descriptionHtml = eventData.long_description
            ? `<hr style="border-color: ${APP_CONFIG.CATEGORIES[eventData.category]["color"]}; background-color: ${APP_CONFIG.CATEGORIES[eventData.category]["color"]};">
               <p id="modal-description" class="modal-description">${linkify(eventData.long_description)}</p>`
            : "";
    }

    return eventData;
}

function handleAccordion(accordion, accordionId) {
    if (accordion.getAttribute("disabled") === "true") return;
    const isOpen = accordion.getAttribute("aria-expanded") === "true";
    const hiddenSection = document.getElementById(accordionId);
    const searchInput = hiddenSection.querySelector(".data-search");

    accordion.setAttribute("aria-expanded", String(!isOpen));

    if (isOpen) {
        hiddenSection.hidden = true;
        accordion.querySelector(".chevron").innerText = "expand_more";
        if (searchInput) searchInput.value = "";

        /* specific action */
        if (accordionId == "update-role-form") {
            selected_profile = null;
            hiddenSection.querySelector("#profile-email").innerText = "-";
            hiddenSection.querySelector("#profile-name").innerText = "-";
            hiddenSection.querySelector("#profile-role").innerText = "-";
            hiddenSection.querySelector("#roles").value = APP_CONFIG.ROLES[0];
            hiddenSection.querySelector("#update-role-button").disabled = true; 
        }
    } else {
        /* open this one */
        hiddenSection.hidden = false;
        accordion.querySelector(".chevron").innerText = "expand_less";
    }
}

