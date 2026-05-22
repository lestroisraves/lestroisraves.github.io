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
            "color": "#48536B",
            "color_light": "#DFE3EB"
        }
    },
    PARENTAL_GUIDE: {
        0: {
            "label": "Tout public",
            "icon": "check_circle",
            "color": "#265E09",
            "color_light": "#e3ffea"
        },
        1: {
            "label": "Pour les enfants",
            "label_short": "Enfants",
            "icon": "child_hat",
            "color": "#685F00",
            "color_light": "#FDF1B4"
        },
        2: {
            "label": "Déconseillé aux enfants",
            "label_short": "Adultes",
            "icon": "18_up_rating",
            "color": "#9B2318",
            "color_light": "#FAEEEB"
        }
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
document.documentElement.style.setProperty("--pg0", APP_CONFIG.PARENTAL_GUIDE[0]["color"]);
document.documentElement.style.setProperty("--pg1", APP_CONFIG.PARENTAL_GUIDE[1]["color"]);
document.documentElement.style.setProperty("--pg2", APP_CONFIG.PARENTAL_GUIDE[2]["color"]);
document.documentElement.style.setProperty("--pg0--light", APP_CONFIG.PARENTAL_GUIDE[0]["color_light"]);
document.documentElement.style.setProperty("--pg1--light", APP_CONFIG.PARENTAL_GUIDE[1]["color_light"]);
document.documentElement.style.setProperty("--pg2--light", APP_CONFIG.PARENTAL_GUIDE[2]["color_light"]);

