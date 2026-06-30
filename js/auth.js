/** Capa de autenticacion con Supabase Auth. */

let _supabaseClient = null;

function getSupabaseClient() {
  if (!_supabaseClient) {
    _supabaseClient = supabase.createClient(
      CONFIG.SUPABASE_URL,
      CONFIG.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      },
    );
  }
  return _supabaseClient;
}

async function signIn(email, password) {
  const sb = getSupabaseClient();
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

async function signOut() {
  const sb = getSupabaseClient();
  await sb.auth.signOut();
  localStorage.removeItem("sb-session");
}

async function getToken() {
  const sb = getSupabaseClient();
  const { data } = await sb.auth.getSession();
  return data.session?.access_token || null;
}

async function getCurrentUser() {
  const sb = getSupabaseClient();
  const { data } = await sb.auth.getUser();
  return data.user;
}

async function isAuthenticated() {
  const token = await getToken();
  return !!token;
}

function requireAuth() {
  isAuthenticated().then((ok) => {
    if (!ok) {
      window.location.href = "./login.html";
    }
  });
}

/* Escuchar cambios de auth (login/logout en otra pestana) */
getSupabaseClient().auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    window.location.href = "./login.html";
  }
});
