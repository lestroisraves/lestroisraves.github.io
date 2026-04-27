console.log("executing:", document.currentScript?.src);

SITE_URL = "https://rcsculture.github.io/agenda/"

APP_CONFIG = {
    SUPABASE_URL: "https://jpicbqssqixagnwejefu.supabase.co",
    SUPABASE_ANON_KEY: "sb_publishable_2N5OfZFZNISlfbjVUwL8KQ_AR45LsK_",
    EMAIL_ADDRESS: "no-reply@rcsculture.gloug.fr",
    EMAILCONFIRMED_REDIRECT_URL: SITE_URL + "/account_comfirmed/",
    RESETPWD_REDIRECT_URL: SITE_URL + "/account_reset_pwd/",
    ROLES: {
        0: {
            "label": "Non-Officiel",
            "actions": "Vous pouvez publier des évènements.\nVos évènements sont publiés après 3 jours.\nVous pouvez éditer vos évènements."
        },
        1: {
            "label": "Officiel",
            "actions": "Vous pouvez publier des évènements.\nVos évènements sont publiés instantanément.\nVous pouvez éditer vos évènements."
        },
        2: {
            "label": "Admin",
            "actions": "Vous pouvez publier des évènements.\nVos évènements sont publiés instantanément.\nVous pouvez éditer tous les évènements."
        },
    },
    CATEGORIES: {
        0: {
            "label": "Concert et club"
        },
        1: {
            "label": "Spectacle vivant",
        },
        2: {
            "label": "Projection"
        },
        3: {
            "label": "Art visuel"
        },
        4: {
            "label": "Autres"
        },
    },
    API_TIMEOUT_MS: 5000
};

