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
        0: "Concert et club",
        1: "Spectacle vivant",
        2: "Projection",
        3: "Art visuel",
        4: "Autres"
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

