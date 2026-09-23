// MOJOLA GARDENS — script commun
// (la connexion au backend se fait désormais via js/supabase-client.js,
//  chargé avant ce fichier — voir mojola-backend-supabase/README.md)

/* ---------- shared local data store (fallback + feeds the admin dashboard
   when the backend is unreachable) ----------
   Data lives in this browser's localStorage only — it is NOT synced across
   devices or visitors. See admin.html for how it's read and displayed. */
const MojolaStore = {
  KEYS: { reservations: 'mojola_reservations', orders: 'mojola_orders', messages: 'mojola_messages' },
  read(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
  },
  add(key, record) {
    try {
      const list = MojolaStore.read(key);
      list.unshift({
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        createdAt: new Date().toISOString(),
        status: 'nouveau',
        ...record
      });
      localStorage.setItem(key, JSON.stringify(list.slice(0, 500)));
    } catch (e) { /* storage unavailable (private mode, quota...) — fail silently */ }
  },
  update(key, id, patch) {
    try {
      const list = MojolaStore.read(key).map(r => r.id === id ? { ...r, ...patch } : r);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  },
  clear(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }
};
window.MojolaStore = MojolaStore;

/* ---------- stock / availability ----------
   "Indisponible" flags for menu products. Read publicly by menu.html and
   commande.html (no admin key needed); written only from admin.html.
   Falls back to localStorage when the backend is unreachable. */
const MojolaStock = {
  LOCAL_KEY: 'mojola_stock',
  readLocal() {
    try { return JSON.parse(localStorage.getItem(this.LOCAL_KEY)) || {}; }
    catch (e) { return {}; }
  },
  writeLocal(map) {
    try { localStorage.setItem(this.LOCAL_KEY, JSON.stringify(map)); } catch (e) { /* ignore */ }
  },
  async getUnavailableSet() {
    const apiResult = await mojolaApiGet('stock');
    if (apiResult.ok) {
      const set = new Set();
      apiResult.data.forEach(r => { if (r.available === false) set.add(r.name); });
      return { source: 'api', set };
    }
    const map = this.readLocal();
    const set = new Set(Object.keys(map).filter(name => map[name] === false));
    return { source: 'local', set };
  },
  // Appelée depuis admin.html — nécessite une session Supabase authentifiée
  // (RLS) pour que l'écriture soit acceptée ; sinon repli local silencieux.
  async setAvailability(name, available) {
    const apiResult = await mojolaApiPut(`stock/${encodeURIComponent(name)}`, { available });
    if (!apiResult.ok) {
      const map = this.readLocal();
      map[name] = available;
      this.writeLocal(map);
    }
    return apiResult;
  }
};
window.MojolaStock = MojolaStock;

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- menu mobile ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- menu tabs: highlight active category on scroll ---------- */
  const tabs = document.querySelectorAll('.menu-tabs a');
  const cats = document.querySelectorAll('.menu-category');
  if (tabs.length && cats.length) {
    const byId = {};
    tabs.forEach(t => byId[t.getAttribute('href').replace('#','')] = t);

    const catObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          tabs.forEach(t => t.classList.remove('active'));
          if (byId[id]) byId[id].classList.add('active');
        }
      });
    }, { rootMargin: '-150px 0px -60% 0px', threshold: 0 });

    cats.forEach(c => catObserver.observe(c));
  }

  /* ---------- gallery filter ---------- */
  const galButtons = document.querySelectorAll('.gal-tabs button');
  const galItems = document.querySelectorAll('.gal-item');
  if (galButtons.length && galItems.length) {
    galButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        galButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        galItems.forEach(item => {
          const show = filter === 'all' || item.dataset.cat === filter;
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ---------- order builder (commande.html) ---------- */
  const orderItems = document.querySelectorAll('.order-item');
  if (orderItems.length) {
    const cartList = document.getElementById('cartList');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartTotal = document.getElementById('cartTotal');
    const cartCount = document.getElementById('cartCount');
    const waBtn = document.getElementById('waSubmit');

    const fmt = (n) => n.toLocaleString('fr-FR') + ' FCFA';

    function readCustomer() {
      const code = document.getElementById('o-telCode')?.value || '';
      const localTel = document.getElementById('o-tel')?.value.trim() || '';
      return {
        nom: document.getElementById('o-nom')?.value.trim() || '',
        tel: localTel ? `${code} ${localTel}`.trim() : '',
        mode: document.getElementById('o-mode')?.value || '',
        date: document.getElementById('o-date')?.value || '',
        heure: document.getElementById('o-heure')?.value || '',
        adresse: document.getElementById('o-adresse')?.value.trim() || '',
        notes: document.getElementById('o-notes')?.value.trim() || ''
      };
    }

    function updateCart() {
      let total = 0, count = 0;
      const lines = [];
      orderItems.forEach(item => {
        const qtyInput = item.querySelector('.qty-input');
        let qty = parseInt(qtyInput.value, 10);
        if (isNaN(qty) || qty < 0) qty = 0;
        if (qty > 20) qty = 20;
        qtyInput.value = qty;
        const price = parseInt(item.dataset.price, 10) || 0;
        const name = item.dataset.name || '';
        const lineTotal = qty * price;
        const lineTotalEl = item.querySelector('.line-total');
        if (lineTotalEl) lineTotalEl.textContent = qty > 0 ? fmt(lineTotal) : '';
        item.classList.toggle('active-item', qty > 0);
        if (qty > 0) {
          total += lineTotal;
          count += qty;
          lines.push({ name, qty, price, lineTotal });
        }
      });

      if (cartList) {
        cartList.innerHTML = '';
        lines.forEach(l => {
          const row = document.createElement('div');
          row.className = 'cart-row';
          row.innerHTML = `<span>${l.qty}× ${l.name}</span><span>${fmt(l.lineTotal)}</span>`;
          cartList.appendChild(row);
        });
      }
      if (cartEmpty) cartEmpty.style.display = lines.length ? 'none' : 'block';
      if (cartTotal) cartTotal.textContent = fmt(total);
      if (cartCount) cartCount.textContent = count;

      return { lines, total };
    }

    orderItems.forEach(item => {
      const input = item.querySelector('.qty-input');
      const minus = item.querySelector('.qty-minus');
      const plus = item.querySelector('.qty-plus');
      minus?.addEventListener('click', () => {
        input.value = Math.max(0, (parseInt(input.value, 10) || 0) - 1);
        updateCart();
      });
      plus?.addEventListener('click', () => {
        input.value = Math.min(20, (parseInt(input.value, 10) || 0) + 1);
        updateCart();
      });
      input?.addEventListener('input', updateCart);
      input?.addEventListener('change', updateCart);
    });

    document.getElementById('cartClear')?.addEventListener('click', () => {
      orderItems.forEach(item => { item.querySelector('.qty-input').value = 0; });
      updateCart();
    });

    waBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      const { lines, total } = updateCart();
      const feedback = document.getElementById('orderFeedback');
      const showFeedback = (text) => { if (feedback) { feedback.textContent = text; feedback.style.display = 'block'; } };

      if (!lines.length) {
        showFeedback('Veuillez choisir au moins un produit avant d\u2019envoyer votre commande.');
        return;
      }
      const c = readCustomer();
      if (!c.nom || !c.tel) {
        showFeedback('Merci de renseigner votre nom et votre téléphone.');
        return;
      }

      let msg = 'Bonjour Mojola Gardens, je souhaite passer la commande suivante :\n\n';
      lines.forEach(l => { msg += `• ${l.qty}x ${l.name} — ${fmt(l.lineTotal)}\n`; });
      msg += `\nTotal : ${fmt(total)}\n\n`;
      msg += `Nom : ${c.nom}\nTéléphone : ${c.tel}\n`;
      if (c.mode) msg += `Mode : ${c.mode}\n`;
      if (c.date) msg += `Date : ${c.date}\n`;
      if (c.heure) msg += `Heure : ${c.heure}\n`;
      if (c.adresse) msg += `Adresse : ${c.adresse}\n`;
      if (c.notes) msg += `Notes : ${c.notes}\n`;

      if (feedback) feedback.style.display = 'none';

      const apiResult = await mojolaApiPost('orders', { ...c, lines, total });
      if (!apiResult.ok) {
        // backend indisponible ou pas encore déployé : on garde une trace locale
        MojolaStore.add(MojolaStore.KEYS.orders, { customer: c, lines, total });
      }
      window.open(`https://wa.me/22953078674?text=${encodeURIComponent(msg)}`, '_blank');
    });

    updateCart();
  }

  /* ---------- forms (backend if available, local log as fallback) ---------- */
  document.querySelectorAll('form[data-mojola-form]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const type = form.dataset.mojolaForm;
      const box = form.querySelector('.form-feedback');

      const fields = {};
      form.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.id) fields[el.id] = el.value;
      });

      if (type === 'reservation') {
        const code = fields.telCode && fields.telCode !== '+other' ? fields.telCode : '';
        const fullTel = `${code} ${fields.tel || ''}`.trim();
        const payload = {
          nom: fields.nom, tel: fullTel, email: fields.email, personnes: fields.personnes,
          date: fields.date, heure: fields.heure, occasion: fields.occasion, zone: fields.zone, message: fields.message
        };
        const apiResult = await mojolaApiPost('reservations', payload);
        if (!apiResult.ok) MojolaStore.add(MojolaStore.KEYS.reservations, { type, fields: { ...fields, tel: fullTel } });

        let msg = 'Bonjour Mojola Gardens, je souhaite réserver une table :\n\n';
        msg += `Nom : ${payload.nom}\n`;
        msg += `Téléphone : ${payload.tel}\n`;
        if (payload.email) msg += `E-mail : ${payload.email}\n`;
        if (payload.personnes) msg += `Convives : ${payload.personnes}\n`;
        if (payload.date) msg += `Date : ${payload.date}\n`;
        if (payload.heure) msg += `Heure : ${payload.heure}\n`;
        if (payload.occasion) msg += `Occasion : ${payload.occasion}\n`;
        if (payload.zone) msg += `Espace préféré : ${payload.zone}\n`;
        if (payload.message) msg += `Message : ${payload.message}\n`;
        window.open(`https://wa.me/22953078674?text=${encodeURIComponent(msg)}`, '_blank');
      } else {
        const cCode = fields['c-telCode'] || '';
        const cTel = fields['c-tel'] || '';
        const payload = { nom: fields['c-nom'], tel: cTel ? `${cCode} ${cTel}`.trim() : '', sujet: fields['c-sujet'], message: fields['c-message'] };
        const apiResult = await mojolaApiPost('messages', payload);
        if (!apiResult.ok) MojolaStore.add(MojolaStore.KEYS.messages, { type, fields: { ...fields, 'c-tel': payload.tel } });
      }

      const label = type === 'reservation'
        ? 'Merci ! Votre demande de réservation a bien été enregistrée. Un onglet WhatsApp vient de s\u2019ouvrir : envoyez le message pré-rempli pour que notre équipe confirme votre table au plus vite.'
        : 'Merci ! Votre message a bien été envoyé. Nous vous répondrons rapidement.';
      if (box) {
        box.textContent = label;
        box.style.display = 'block';
      }
      form.reset();
    });
  });

});

/* ---------- apply "indisponible" status on menu.html / commande.html ----------
   Runs after the block above so order-item controls are already wired up. */
document.addEventListener('DOMContentLoaded', async () => {
  const nameEls = document.querySelectorAll('[data-name]');
  if (!nameEls.length) return;

  const { set: unavailableSet } = await MojolaStock.getUnavailableSet();
  if (!unavailableSet.size) return;

  nameEls.forEach(el => {
    const name = el.dataset.name;
    if (!unavailableSet.has(name)) return;

    if (el.classList.contains('order-item')) {
      // commande.html
      el.classList.add('unavailable');
      const qtyInput = el.querySelector('.qty-input');
      const minus = el.querySelector('.qty-minus');
      const plus = el.querySelector('.qty-plus');
      if (qtyInput) { qtyInput.value = 0; qtyInput.disabled = true; }
      if (minus) minus.disabled = true;
      if (plus) plus.disabled = true;
      const h4 = el.querySelector('.order-item-info h4');
      if (h4 && !h4.querySelector('.unavail-badge')) {
        h4.insertAdjacentHTML('beforeend', ' <span class="unavail-badge">Indisponible</span>');
      }
    } else if (el.classList.contains('menu-item') || el.classList.contains('combo-card')) {
      // menu.html — plats avec image ou plateaux
      el.classList.add('unavailable');
      const h4 = el.querySelector('h4');
      if (h4 && !h4.querySelector('.unavail-badge')) {
        h4.insertAdjacentHTML('beforeend', ' <span class="unavail-badge">Indisponible</span>');
      }
    } else if (el.tagName === 'TD' && el.classList.contains('name')) {
      // menu.html — lignes de tableau (boissons, garnitures, braisés)
      const tr = el.closest('tr');
      if (tr) tr.classList.add('unavailable');
      if (!el.querySelector('.unavail-badge')) {
        el.insertAdjacentHTML('beforeend', ' <span class="unavail-badge">Indisponible</span>');
      }
    }
  });
});
