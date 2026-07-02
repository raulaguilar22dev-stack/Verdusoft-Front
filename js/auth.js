/** Capa de autenticacion con Supabase Auth. */

let _supabaseClient = null;
let _heartbeatInterval = null;

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
  stopSessionHeartbeat();
  const sb = getSupabaseClient();
  await sb.auth.signOut();
  localStorage.removeItem("sb-session");
}

function startSessionHeartbeat(intervalMs = 300000) {
  stopSessionHeartbeat();
  _heartbeatInterval = setInterval(async () => {
    const sb = getSupabaseClient();
    const { data, error } = await sb.auth.getSession();
    if (error || !data.session) {
      console.warn("[heartbeat] Sesion no encontrada o error:", error);
      return;
    }
    console.log("[heartbeat] Sesion viva, token expira en", Math.round(data.session.expires_in), "s");
  }, intervalMs);
}

function stopSessionHeartbeat() {
  if (_heartbeatInterval) {
    clearInterval(_heartbeatInterval);
    _heartbeatInterval = null;
  }
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
    stopSessionHeartbeat();
    window.location.href = "./login.html";
  }
  if (event === "INITIAL_SESSION" && !session) {
    // No hay sesion al cargar la pagina: redirigir si estamos en una pagina protegida
    const protectedPages = ["admin.html", "historial_ventas.html"];
    const currentPage = window.location.pathname.split("/").pop();
    if (protectedPages.includes(currentPage)) {
      window.location.href = "./login.html";
    }
  }
});
