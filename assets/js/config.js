console.log("executing:", document.currentScript?.src);

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
        2: "Admin",
    },
    CATEGORIES: {
        0: {
            "label": "Concert",
            "color": "#524ED2",
            "icon": "music_note_2"
        },
        1: {
            "label": "Spectacle vivant",
            "color": "#007A50",
            "icon": "festival"
        },
        2: {
            "label": "Projection",
            "color": "#6F277D",
            "icon": "theater_comedy"
        },
        3: {
            "label": "Art visuel",
            "color": "#B78800",
            "icon": "palette"
        },
        4: {
            "label": "Autres",
            "color": "#5C6370",
            "icon": "stadium"
        }
    },
    PARENTAL_GUIDE: {
        0: "Tout public",
        1: "Pour les enfants",
        2: "Déconseillé aux enfants"
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

