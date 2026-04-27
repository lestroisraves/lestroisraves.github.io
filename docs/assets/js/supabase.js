console.log("executing:", document.currentScript?.src);

window.supabaseClient = supabase.createClient(
    APP_CONFIG.SUPABASE_URL,
    APP_CONFIG.SUPABASE_ANON_KEY
);

console.log("supabase client initialized");