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

function getCategoryId(category) {
    var catId = 4;
    Object.keys(APP_CONFIG.CATEGORIES).forEach(key => {
        if (category == APP_CONFIG.CATEGORIES[key]["label"])
        {
            catId = key;
            return;
        }
    });
    return catId;
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

function renderMaterialIconText(icon, text) {
    return `<span class="event-icon-text">
                <span class="material-symbols-outlined">${icon}</span>
                <span class="text">${text}</span>
            </span>
            `
}

function renderMaterialIcon(icon) {
    return `<span class="event-icon-text">
                <span class="material-symbols-outlined">${icon}</span>
            </span>
            `
}

// function linkify(text) {
//     const urlRegex = /(https?:\/\/[^\s]+)/g;

//     return text.replace(urlRegex, (url) => {
//         return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
//     });
// }

function linkify(text) {
    const urlRegex = /(\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+)/gi;

    return text.replace(urlRegex, (url) => {
        const href = url.startsWith("http")
            ? url
            : `https://${url}`;

        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
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

