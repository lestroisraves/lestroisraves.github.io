console.log("executing:", "config.js");

SITE_URL = "https://rcsculture.github.io"

APP_CONFIG = {
    SUPABASE_URL: "https://jpicbqssqixagnwejefu.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable_2N5OfZFZNISlfbjVUwL8KQ_AR45LsK_",
    EMAIL_ADDRESS: "no-reply@rcsculture.gloug.fr",
    EMAILCONFIRMED_REDIRECT_URL: SITE_URL + "/account_comfirmed/",
    RESETPWD_REDIRECT_URL: SITE_URL + "/account_reset_pwd/",
    ROLES: {
        0: "Non-Officiel",
        1: "Officiel",
        2: "Modérateur",
        3: "Admin"
    },
    USER_TYPES: {
        0: {
            "label": "Particulier",
            "example": ["habitant"]
        },
        1: {
            "label": "Acteur individuel",
            "example": ["artiste indépendant", "Auteur / Ecrivain", "Musicien", "Dj", "Performeur"]
        },
        2: {
            "label": "Organisation artistique",
            "example": ["compagnie", "orchestre", "groupe de musique", "collectif", "troupe"]
        },
        3: {
            "label": "Structure évènementielle",
            "example": ["société de production", "agence", "festival", "programmateur", "organisateur"]
        },
        4: {
            "label": "Lieu culturel privé",
            "example": ["théatre", "salle de concert", "bar", "galerie", "cinéma"]
        },
        5: {
            "label": "Lieu public",
            "example": ["médiathèque", "musée", "théatree", "centre", "MJC"]
        },
        6: {
            "label": "Collectif",
            "example": ["collectif artistique", "groupe citoyen", "réseau militant"]
        },
        7: {
            "label": "Acteur du patrimoine et du tourisme",
            "example": ["office de tourisme", "site patrimonial", "parc historique"]
        },
        8: {
            "label": "Média culturel",
            "example": ["radio", "TV", "platefrom numérique", "label", "maison d'édition", "studio"]
        },
        9: {
            "label": "Acteur social",
            "example": ["centre social", "maison de quartier", "structure", "animateur culturel", "réseau éducatif", "EHPAD", "MJC", "ONG"]
        },
        10: {
            "label": "Association",
            "example": []
        },
        11: {
            "label": "Autre",
            "example": []
        }
    },
    CATEGORIES: {
        0: {
            "label": "Concert",
            "icon": "music_note_2",
            "color": "#3838AB",
            "color_light": "#eef2ff"
        },
        1: {
            "label": "Spectacle vivant",
            "label_short": "Spectacle",
            "icon": "theater_comedy",
            "color": "#15803d",
            "color_light": "#f0fdf4"
        },
        2: {
            "label": "Projection",
            "icon": "video_camera_back",
            "color": "#d97706",
            "color_light": "#fffbeb"
        },
        3: {
            "label": "Art visuel",
            "icon": "palette",
            "color": "#ec4899",
            "color_light": "#fdf2f8"
        },
        4: {
            "label": "Litérature",
            "icon": "auto_stories",
            "color": "#02659A",
            "color_light": "#D1E5FB"
        },
        5: {
            "label": "Autre",
            "icon": "star",
            "color": "#914a4a",
            "color_light": "#fff0f0"
        }
    },
    PARENTAL_GUIDE: {
        0: {
            "label": "Tout public",
            "icon": "check_circle"
        },
        1: {
            "label": "Pour les enfants",
            "label_short": "Enfants",
            "icon": "child_hat"
        },
        2: {
            "label": "Déconseillé aux enfants",
            "label_short": "Adultes",
            "icon": "18_up_rating"
        }
    },
    PRICE_CHOICES: {
        0: {
            "label": "Gratuit",
            "icon": "cruelty_free"
        },
        1: {
            "label": "Prix libre",
            "icon": "volunteer_activism"
        },
        2: {
            "label": "Payant",
            "icon": "euro"
        }
    },
    AREAS: {
        0: {
            "label": "Rabas/Couf",
            "icon": "explore_nearby"
        },
        1: {
            "label": "Salvagnac",
            "icon": "explore_nearby"
        },
        2: {
            "label": "Ailleurs",
            "icon": "explore_nearby"
        }
    },
    API_TIMEOUT_MS: 5000
};

/* create color variables for CSS */
document.documentElement.style.setProperty("--category0", APP_CONFIG.CATEGORIES[0]["color"]);
document.documentElement.style.setProperty("--category1", APP_CONFIG.CATEGORIES[1]["color"]);
document.documentElement.style.setProperty("--category2", APP_CONFIG.CATEGORIES[2]["color"]);
document.documentElement.style.setProperty("--category3", APP_CONFIG.CATEGORIES[3]["color"]);
document.documentElement.style.setProperty("--category4", APP_CONFIG.CATEGORIES[4]["color"]);
document.documentElement.style.setProperty("--category5", APP_CONFIG.CATEGORIES[5]["color"]);
document.documentElement.style.setProperty("--category0--light", APP_CONFIG.CATEGORIES[0]["color_light"]);
document.documentElement.style.setProperty("--category1--light", APP_CONFIG.CATEGORIES[1]["color_light"]);
document.documentElement.style.setProperty("--category2--light", APP_CONFIG.CATEGORIES[2]["color_light"]);
document.documentElement.style.setProperty("--category3--light", APP_CONFIG.CATEGORIES[3]["color_light"]);
document.documentElement.style.setProperty("--category4--light", APP_CONFIG.CATEGORIES[4]["color_light"]);
document.documentElement.style.setProperty("--category5--light", APP_CONFIG.CATEGORIES[5]["color_light"]);

