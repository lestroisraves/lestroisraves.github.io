console.log("executing:", "user_profile.js");

async function getSessionUserProfile() {
    const { data:{ session } } = await window.supabaseClient.auth.getSession();
    console.log("session:", session);
    if (session?.user) {
        const { data: profile, error } = await window.supabaseClient.from('profiles')
            .select("*")
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error(error);
            return {
                session: session,
                profile: null
            }
        }
        console?.log("user_profile?", profile)
        return {
            session: session,
            profile: profile
        }
    }
    return {
        session: session,
        profile: null
    }
}