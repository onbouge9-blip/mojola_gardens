// MOJOLA GARDENS — tableau de bord (admin.js)
// Utilise l'API backend (voir mojola-backend/) quand MOJOLA_API_BASE est configuré
// et joignable. Sinon, repli automatique sur les données locales (localStorage)
// enregistrées par script.js — visibles uniquement sur cet appareil.

const ADMIN_PASSCODE = 'MG_23dec_2026_Admin'; // code de secours utilisé UNIQUEMENT si le backend est injoignable

let usingApi = false;
let adminKey = '';
let lastReservations = [];
let lastOrders = [];
let lastMessages = [];

document.addEventListener('DOMContentLoaded', () => {

  const gate = document.getElementById('adminGate');
  const dashboard = document.getElementById('adminDashboard');
  const gateForm = document.getElementById('gateForm');
  const gateError = document.getElementById('gateError');
  const logoutBtn = document.getElementById('logoutBtn');

  function showDashboard() {
    gate.style.display = 'none';
    dashboard.style.display = 'block';
    document.querySelectorAll('[id^="clear"]').forEach(b => { b.style.display = usingApi ? 'none' : ''; });
    renderAll();
  }

  async function checkApiHealth() {
    if (!MOJOLA_API_ENABLED) return false;
    try {
      const res = await fetch(`${MOJOLA_API_BASE}/health`);
      return res.ok;
    } catch (e) { return false; }
  }

  // session déjà ouverte (même onglet) : on restaure l'état sans redemander le code
  if (sessionStorage.getItem('mojola_admin_authed') === '1') {
    adminKey = sessionStorage.getItem('mojola_admin_key') || '';
    usingApi = !!adminKey && MOJOLA_API_ENABLED;
    showDashboard();
  }

  gateForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = document.getElementById('gatePass').value;
    gateError.style.display = 'none';

    if (MOJOLA_API_ENABLED && await checkApiHealth()) {
      try {
        const res = await fetch(`${MOJOLA_API_BASE}/reservations`, { headers: { 'x-admin-key': value } });
        if (res.ok) {
          usingApi = true;
          adminKey = value;
          sessionStorage.setItem('mojola_admin_authed', '1');
          sessionStorage.setItem('mojola_admin_key', value);
          return showDashboard();
        }
        if (res.status === 401) {
          gateError.textContent = 'Code incorrect.';
          gateError.style.display = 'block';
          return;
        }
      } catch (e) { /* backend injoignable malgré le health check — on retente en local */ }
    }

    // repli : code local (utile avant déploiement du backend, ou hors-ligne)
    if (value === ADMIN_PASSCODE) {
      usingApi = false;
      adminKey = '';
      sessionStorage.setItem('mojola_admin_authed', '1');
      sessionStorage.removeItem('mojola_admin_key');
      showDashboard();
    } else {
      gateError.textContent = 'Code incorrect.';
      gateError.style.display = 'block';
    }
  });

  logoutBtn?.addEventListener('click', () => {
    sessionStorage.removeItem('mojola_admin_authed');
    sessionStorage.removeItem('mojola_admin_key');
    location.reload();
  });

  /* ---------- helpers ---------- */
  const fmtMoney = (n) => (n || 0).toLocaleString('fr-FR') + ' FCFA';
  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return iso; }
  };
  const isToday = (iso) => {
    const d = new Date(iso), t = new Date();
    return d.toDateString() === t.toDateString();
  };

  function downloadCSV(filename, rows) {
    const csv = rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function statusOptions(kind) {
    if (kind === 'reservations') return ['nouveau', 'confirmée', 'annulée'];
    if (kind === 'orders') return ['nouveau', 'confirmée', 'livrée', 'annulée'];
    return ['nouveau', 'traité'];
  }

  function statusSelectHTML(kind, id, current) {
    const opts = statusOptions(kind).map(s => `<option value="${s}" ${s === current ? 'selected' : ''}>${s}</option>`).join('');
    return `<select class="status-select st-${current}" data-kind="${kind}" data-id="${id}">${opts}</select>`;
  }

  /* ---------- normalize API rows and local records into one common shape ---------- */
  const normalize = {
    reservationApi: r => ({ id: r.id, createdAt: r.created_at, status: r.status, nom: r.nom, tel: r.tel, email: r.email, personnes: r.personnes, date: r.date, heure: r.heure, occasion: r.occasion, zone: r.zone, message: r.message }),
    reservationLocal: r => { const f = r.fields || {}; return { id: r.id, createdAt: r.createdAt, status: r.status, nom: f.nom, tel: f.tel, email: f.email, personnes: f.personnes, date: f.date, heure: f.heure, occasion: f.occasion, zone: f.zone, message: f.message }; },
    orderApi: o => ({ id: o.id, createdAt: o.created_at, status: o.status, nom: o.nom, tel: o.tel, mode: o.mode, date: o.date, heure: o.heure, adresse: o.adresse, notes: o.notes, total: o.total, lines: o.lines || [] }),
    orderLocal: o => { const c = o.customer || {}; return { id: o.id, createdAt: o.createdAt, status: o.status, nom: c.nom, tel: c.tel, mode: c.mode, date: c.date, heure: c.heure, adresse: c.adresse, notes: c.notes, total: o.total, lines: o.lines || [] }; },
    messageApi: m => ({ id: m.id, createdAt: m.created_at, status: m.status, nom: m.nom, tel: m.tel, sujet: m.sujet, message: m.message }),
    messageLocal: m => { const f = m.fields || {}; return { id: m.id, createdAt: m.createdAt, status: m.status, nom: f['c-nom'], tel: f['c-tel'], sujet: f['c-sujet'], message: f['c-message'] }; }
  };

  async function fetchKind(kind) {
    if (usingApi) {
      try {
        const res = await fetch(`${MOJOLA_API_BASE}/${kind}`, { headers: { 'x-admin-key': adminKey } });
        if (res.ok) return { source: 'api', data: await res.json() };
      } catch (e) { /* bascule vers le local ci-dessous */ }
    }
    return { source: 'local', data: MojolaStore.read(MojolaStore.KEYS[kind]) };
  }

  async function loadAll() {
    const [res, ord, msg] = await Promise.all([fetchKind('reservations'), fetchKind('orders'), fetchKind('messages')]);
    const source = res.source; // les trois partagent la même connectivité
    return {
      source,
      reservations: res.data.map(source === 'api' ? normalize.reservationApi : normalize.reservationLocal),
      orders: ord.data.map(source === 'api' ? normalize.orderApi : normalize.orderLocal),
      messages: msg.data.map(source === 'api' ? normalize.messageApi : normalize.messageLocal)
    };
  }

  function updateSourceBanner(source) {
    const el = document.getElementById('dataSourceBanner');
    if (!el) return;
    if (source === 'api') {
      el.innerHTML = '🟢 <strong>Connecté à la base de données en ligne</strong> — visible depuis n\u2019importe quel appareil.';
    } else {
      el.innerHTML = '🟡 <strong>Mode local</strong> — backend non connecté ou injoignable. Ces données restent sur cet appareil uniquement. Configurez <code>MOJOLA_API_BASE</code> dans <code>js/script.js</code> et <code>js/admin.js</code> une fois votre backend déployé (voir <code>mojola-backend/README.md</code>).';
    }
  }

  /* ---------- KPIs ---------- */
  function renderKPIs(reservations, orders, messages) {
    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const resToday = reservations.filter(r => isToday(r.createdAt)).length;
    const ordToday = orders.filter(o => isToday(o.createdAt)).length;
    const msgToday = messages.filter(m => isToday(m.createdAt)).length;

    document.getElementById('kpiReservations').textContent = reservations.length;
    document.getElementById('kpiReservationsSub').textContent = `+${resToday} aujourd'hui`;
    document.getElementById('kpiOrders').textContent = orders.length;
    document.getElementById('kpiOrdersSub').textContent = `+${ordToday} aujourd'hui`;
    document.getElementById('kpiRevenue').textContent = fmtMoney(revenue);
    document.getElementById('kpiRevenueSub').textContent = 'estimé, commandes du site';
    document.getElementById('kpiMessages').textContent = messages.length;
    document.getElementById('kpiMessagesSub').textContent = `+${msgToday} aujourd'hui`;
  }

  /* ---------- reservations table ---------- */
  function renderReservations(list) {
    const body = document.getElementById('reservationsBody');
    const empty = document.getElementById('reservationsEmpty');
    if (!list.length) { body.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    body.innerHTML = list.map(r => `<tr>
        <td class="muted">${fmtDate(r.createdAt)}</td>
        <td>${r.nom || ''}</td>
        <td>${r.tel || ''}</td>
        <td>${r.personnes || ''}</td>
        <td>${r.date || ''} ${r.heure || ''}</td>
        <td>${r.occasion || '—'}</td>
        <td class="muted">${(r.message || '').slice(0, 60)}</td>
        <td>${statusSelectHTML('reservations', r.id, r.status || 'nouveau')}</td>
      </tr>`).join('');
  }

  /* ---------- orders table + top products ---------- */
  function renderOrders(list) {
    const body = document.getElementById('ordersBody');
    const empty = document.getElementById('ordersEmpty');
    if (!list.length) { body.innerHTML = ''; empty.style.display = 'block'; }
    else {
      empty.style.display = 'none';
      body.innerHTML = list.map(o => {
        const itemsSummary = (o.lines || []).map(l => `${l.qty}× ${l.name}`).join(', ');
        return `<tr>
          <td class="muted">${fmtDate(o.createdAt)}</td>
          <td>${o.nom || ''}</td>
          <td>${o.tel || ''}</td>
          <td class="muted">${itemsSummary}</td>
          <td>${o.mode || '—'}</td>
          <td><strong>${fmtMoney(o.total)}</strong></td>
          <td>${statusSelectHTML('orders', o.id, o.status || 'nouveau')}</td>
        </tr>`;
      }).join('');
    }

    const tally = {};
    list.forEach(o => (o.lines || []).forEach(l => { tally[l.name] = (tally[l.name] || 0) + l.qty; }));
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const chartWrap = document.getElementById('topProductsChart');
    if (!top.length) {
      chartWrap.innerHTML = '<div class="admin-empty">Pas encore de commandes pour calculer les produits populaires.</div>';
    } else {
      const max = top[0][1];
      chartWrap.innerHTML = top.map(([name, qty]) => `
        <div class="chart-row">
          <span class="name">${name}</span>
          <div class="chart-track"><div class="chart-fill" style="width:${Math.max(6, (qty / max) * 100)}%"></div></div>
          <span class="qty">${qty}</span>
        </div>`).join('');
    }
  }

  /* ---------- messages table ---------- */
  function renderMessages(list) {
    const body = document.getElementById('messagesBody');
    const empty = document.getElementById('messagesEmpty');
    if (!list.length) { body.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    body.innerHTML = list.map(m => `<tr>
        <td class="muted">${fmtDate(m.createdAt)}</td>
        <td>${m.nom || ''}</td>
        <td>${m.tel || ''}</td>
        <td>${m.sujet || '—'}</td>
        <td class="muted">${(m.message || '').slice(0, 80)}</td>
        <td>${statusSelectHTML('messages', m.id, m.status || 'nouveau')}</td>
      </tr>`).join('');
  }

  async function renderAll() {
    const { source, reservations, orders, messages } = await loadAll();
    usingApi = source === 'api';
    lastReservations = reservations; lastOrders = orders; lastMessages = messages;
    updateSourceBanner(source);
    document.querySelectorAll('[id^="clear"]').forEach(b => { b.style.display = usingApi ? 'none' : ''; });
    renderKPIs(reservations, orders, messages);
    renderReservations(reservations);
    renderOrders(orders);
    renderMessages(messages);
    renderStock();
  }

  /* ---------- stock panel ---------- */
  async function renderStock() {
    const wrap = document.getElementById('stockList');
    if (!wrap || !window.MOJOLA_CATALOG) return;
    const { set: unavailableSet } = await MojolaStock.getUnavailableSet();

    wrap.innerHTML = MOJOLA_CATALOG.map(group => `
      <div class="stock-category">
        <h4>${group.category}</h4>
        ${group.items.map(name => {
          const available = !unavailableSet.has(name);
          const safeId = 'stk_' + btoa(unescape(encodeURIComponent(name))).replace(/[^a-zA-Z0-9]/g, '');
          return `<div class="stock-row">
            <span class="name">${name}</span>
            <label class="switch">
              <input type="checkbox" id="${safeId}" data-name="${name.replace(/"/g, '&quot;')}" ${available ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>`;
        }).join('')}
      </div>
    `).join('');
  }

  document.getElementById('stockList')?.addEventListener('change', async (e) => {
    if (e.target.type !== 'checkbox') return;
    const name = e.target.dataset.name;
    const available = e.target.checked;
    const headers = usingApi ? { 'x-admin-key': adminKey } : null;
    await MojolaStock.setAvailability(name, available, headers);
  });

  /* ---------- status changes (event delegation) ---------- */
  document.getElementById('adminDashboard').addEventListener('change', async (e) => {
    if (!e.target.classList.contains('status-select')) return;
    const kind = e.target.dataset.kind, id = e.target.dataset.id, value = e.target.value;
    e.target.className = `status-select st-${value}`;

    if (usingApi) {
      try {
        const res = await fetch(`${MOJOLA_API_BASE}/${kind}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify({ status: value })
        });
        if (!res.ok) alert('Le serveur a refusé la mise à jour du statut. Réessayez.');
      } catch (e2) {
        alert('Backend injoignable : le statut n\u2019a pas pu être mis à jour.');
      }
    } else {
      MojolaStore.update(MojolaStore.KEYS[kind], id, { status: value });
    }
    renderAll();
  });

  /* ---------- tabs ---------- */
  document.querySelectorAll('.admin-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tabs button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.panel).classList.add('active');
    });
  });

  /* ---------- export buttons (export what's currently displayed) ---------- */
  document.getElementById('exportReservations')?.addEventListener('click', () => {
    const rows = [['Date reçue', 'Nom', 'Téléphone', 'Email', 'Convives', 'Date souhaitée', 'Heure', 'Occasion', 'Espace', 'Message', 'Statut']];
    lastReservations.forEach(r => rows.push([fmtDate(r.createdAt), r.nom, r.tel, r.email, r.personnes, r.date, r.heure, r.occasion, r.zone, r.message, r.status]));
    downloadCSV('mojola_reservations.csv', rows);
  });

  document.getElementById('exportOrders')?.addEventListener('click', () => {
    const rows = [['Date reçue', 'Nom', 'Téléphone', 'Mode', 'Date', 'Heure', 'Adresse', 'Produits', 'Total', 'Notes', 'Statut']];
    lastOrders.forEach(o => {
      const items = (o.lines || []).map(l => `${l.qty}x ${l.name}`).join(' | ');
      rows.push([fmtDate(o.createdAt), o.nom, o.tel, o.mode, o.date, o.heure, o.adresse, items, o.total, o.notes, o.status]);
    });
    downloadCSV('mojola_commandes.csv', rows);
  });

  document.getElementById('exportMessages')?.addEventListener('click', () => {
    const rows = [['Date reçue', 'Nom', 'Téléphone', 'Sujet', 'Message', 'Statut']];
    lastMessages.forEach(m => rows.push([fmtDate(m.createdAt), m.nom, m.tel, m.sujet, m.message, m.status]));
    downloadCSV('mojola_messages.csv', rows);
  });

  /* ---------- clear buttons (local mode only — hidden automatically in API mode) ---------- */
  function wireClear(btnId, kind) {
    document.getElementById(btnId)?.addEventListener('click', () => {
      if (confirm('Vider définitivement ces données locales ? Cette action est irréversible.')) {
        MojolaStore.clear(MojolaStore.KEYS[kind]);
        renderAll();
      }
    });
  }
  wireClear('clearReservations', 'reservations');
  wireClear('clearOrders', 'orders');
  wireClear('clearMessages', 'messages');

});
