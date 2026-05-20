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
    CATEGORIES: {
        0: {
            "label": "Concert",
            "icon": "music_note_2",
            "color": "#3838AB",
            "color_light": "#eef2ff"
        },
        1: {
            "label": "Spectacle vivant",
            "icon": "theater_comedy",
            "color": "#15803d",
            "color_light": "#f0fdf4"
        },
        2: {
            "label": "Projection",
            "icon": "movie",
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
            "label": "Autres",
            "icon": "star",
            "color": "#5C6370",
            "color_light": "#F0F1F3"
        }
    },
    PARENTAL_GUIDE: {
        0: "Tout public",
        1: "Pour les enfants",
        2: "Déconseillé aux enfants"
    },
    PRICE_CHOICES: {
        0: "Gratuit",
        1: "Participation libre",
        2: "Payant"
    },
    DEFAULT_FILTER: {
        categories: null,
        pg: null,
        tags: null,
        from: null,
        to: null
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

