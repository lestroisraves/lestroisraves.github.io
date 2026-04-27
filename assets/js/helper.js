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
                <span class="material-icons">${icon}</span>
                <span class="text">${text}</span>
            </span>
            `

}
