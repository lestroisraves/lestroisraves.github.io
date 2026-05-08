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

function getPgId(label) {
    var id = 4;
    Object.keys(APP_CONFIG.PARENTAL_GUIDE).forEach(key => {
        if (label == APP_CONFIG.PARENTAL_GUIDE[key])
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
    return `Du ${formatDateForUI(startDate)} au ${formatDateForUI(endDate)}`;
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
    `
}

function renderEventData(event, details = false) {
    const eventData = event;

    eventData.categoryHtml = `
        <div class="event-meta category" style="color:${APP_CONFIG.CATEGORIES[eventData.category]["color"]};">
        ${renderMaterialIconText(APP_CONFIG.CATEGORIES[eventData.category]["icon"], APP_CONFIG.CATEGORIES[eventData.category]["label"])}
        </div>
    `

    eventData.timeHtml = eventData.event_start_time
        ? renderMaterialIconText("schedule", formatTimeForUI(eventData.event_start_time))
        : "";

    eventData.tagsHtml = eventData.tags && eventData.tags.length
        ? `
            <div class="event-tags">
                ${eventData.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
            </div>
        `
        : "";

    eventData.imageHtml = eventData.image_url
        ? ` <div class="event-image-wrapper"><img src="${eventData.image_url}" class="event-thumbnail" alt="image évènement"></div>`
        : "";

    eventData.price = "Gratuit";
    if (eventData.is_free_price) {
        eventData.price = "Participation libre";
    } else if (eventData.min_price && eventData.max_price) {
        eventData.price = eventData.min_price + " à " + eventData.max_price + " €";
    } else if (eventData.max_price) {
        eventData.price = eventData.max_price + " €";
    }

    switch (eventData.parental_guide)
    {
        case 1:
            eventData.parentalGuideHtml = renderMaterialIconText("child_friendly", APP_CONFIG.PARENTAL_GUIDE[1]);
            break;
        case 2:
            eventData.parentalGuideHtml = renderMaterialIconText("no_stroller", APP_CONFIG.PARENTAL_GUIDE[2]);
            break;
        default:
            eventData.parentalGuideHtml = renderMaterialIconText("child_hat", APP_CONFIG.PARENTAL_GUIDE[0]);
    }

    eventData.date = formatDateForUI(eventData.event_date);

    if (details) {
        // render extra information for event modal
        eventData.addressHtml = eventData.location_address
            ? renderMaterialIconText("distance", eventData.location_address)
            : "";

        eventData.phoneHtml = eventData.phone
            ? renderMaterialIconText("call", eventData.phone)
            : "";

        eventData.siteUrlHtml = eventData.site_url
            ? renderMaterialIconText("language", linkify(eventData.site_url))
            : "";

        eventData.eatHtml = eventData.to_eat
            ? renderMaterialIconText("fork_spoon", "À manger sur place")
            : "";

        eventData.descriptionHtml = eventData.long_description
            ? `
            <hr>
            <p id="modal-description" class="modal-description">${linkify(eventData.long_description)}</p>
            `
            : "";
    }

    return eventData;
}

