// MOJOLA GARDENS — connexion Supabase
// ------------------------------------------------------------------
// Remplacez les deux valeurs ci-dessous par celles de VOTRE projet
// Supabase (dashboard Supabase → Settings → API) :
//   - SUPABASE_URL       → "Project URL"
//   - SUPABASE_ANON_KEY  → "anon public" key
// Et SUPABASE_ADMIN_EMAIL par l'email de l'utilisateur admin que vous
// aurez créé dans Authentication → Users (voir instructions fournies).
// Tant que SUPABASE_URL n'est pas remplacée, le site reste en mode
// 100% local (comportement inchangé).
// ------------------------------------------------------------------

const SUPABASE_URL = 'REPLACE_WITH_YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'REPLACE_WITH_YOUR_SUPABASE_ANON_KEY';
const SUPABASE_ADMIN_EMAIL = 'admin@mojolagardens.com';

const SUPABASE_ENABLED = !SUPABASE_URL.includes('REPLACE_WITH_YOUR_SUPABASE_URL');

const sb = SUPABASE_ENABLED ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
window.mojolaSb = sb;
window.SUPABASE_ADMIN_EMAIL = SUPABASE_ADMIN_EMAIL;

// Conservé pour compatibilité avec le reste du code (script.js / admin.js
// testent cette variable pour savoir si un backend est disponible).
window.MOJOLA_API_ENABLED = SUPABASE_ENABLED;

const TABLES = ['orders', 'reservations', 'messages'];

async function mojolaApiGet(endpoint) {
  if (!SUPABASE_ENABLED) return { ok: false, offline: true };
  try {
    if (endpoint === 'stock') {
      const { data, error } = await sb.from('stock').select('name, available, updated_at');
      if (error) return { ok: false, offline: false };
      return { ok: true, data: data.map(r => ({ name: r.name, available: r.available, updatedAt: r.updated_at })) };
    }
    if (TABLES.includes(endpoint)) {
      const { data, error } = await sb.from(endpoint).select('*').order('created_at', { ascending: false });
      if (error) return { ok: false, offline: false };
      return { ok: true, data };
    }
    return { ok: false, offline: false };
  } catch (e) {
    return { ok: false, offline: true };
  }
}
window.mojolaApiGet = mojolaApiGet;

async function mojolaApiPost(endpoint, payload) {
  if (!SUPABASE_ENABLED) return { ok: false, offline: true };
  try {
    if (TABLES.includes(endpoint)) {
      const { data, error } = await sb.from(endpoint).insert(payload).select().single();
      if (error) return { ok: false, offline: false };
      return { ok: true, data };
    }
    return { ok: false, offline: false };
  } catch (e) {
    return { ok: false, offline: true };
  }
}
window.mojolaApiPost = mojolaApiPost;

// Émule l'ancien "PUT /stock/:name" du backend Express via un upsert Supabase.
async function mojolaApiPut(endpoint, payload) {
  if (!SUPABASE_ENABLED) return { ok: false, offline: true };
  try {
    if (endpoint.startsWith('stock/')) {
      const name = decodeURIComponent(endpoint.slice('stock/'.length));
      const { data, error } = await sb.from('stock')
        .upsert({ name, available: payload.available, updated_at: new Date().toISOString() }, { onConflict: 'name' })
        .select().single();
      if (error) return { ok: false, offline: false };
      return { ok: true, data };
    }
    return { ok: false, offline: false };
  } catch (e) {
    return { ok: false, offline: true };
  }
}
window.mojolaApiPut = mojolaApiPut;

// Nouveau : met à jour le statut d'une commande / réservation / message.
async function mojolaApiPatch(kind, id, patch) {
  if (!SUPABASE_ENABLED) return { ok: false, offline: true };
  try {
    const { error } = await sb.from(kind).update(patch).eq('id', id);
    if (error) return { ok: false, offline: false };
    return { ok: true };
  } catch (e) {
    return { ok: false, offline: true };
  }
}
window.mojolaApiPatch = mojolaApiPatch;
