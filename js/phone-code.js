// MOJOLA GARDENS — sélecteur d'indicatif téléphonique avec drapeaux
// S'applique automatiquement à tout .tel-group[data-phone-field] présent sur la page.
// Utilise des images de drapeaux (flagcdn.com) plutôt que des emoji, pour un rendu
// identique sur tous les systèmes (les emoji drapeau ne s'affichent pas sur Windows).

const MOJOLA_PHONE_COUNTRIES = [
  { cc: 'bj', dial: '+229', name: 'Bénin' },
  { cc: 'tg', dial: '+228', name: 'Togo' },
  { cc: 'ng', dial: '+234', name: 'Nigéria' },
  { cc: 'gh', dial: '+233', name: 'Ghana' },
  { cc: 'ci', dial: '+225', name: "Côte d'Ivoire" },
  { cc: 'ne', dial: '+227', name: 'Niger' },
  { cc: 'bf', dial: '+226', name: 'Burkina Faso' },
  { cc: 'ml', dial: '+223', name: 'Mali' },
  { cc: 'sn', dial: '+221', name: 'Sénégal' },
  { cc: 'cm', dial: '+237', name: 'Cameroun' },
  { cc: 'ga', dial: '+241', name: 'Gabon' },
  { cc: 'cg', dial: '+242', name: 'Congo' },
  { cc: 'cd', dial: '+243', name: 'RD Congo' },
  { cc: 'fr', dial: '+33', name: 'France' },
  { cc: 'be', dial: '+32', name: 'Belgique' },
  { cc: 'ch', dial: '+41', name: 'Suisse' },
  { cc: 'de', dial: '+49', name: 'Allemagne' },
  { cc: 'gb', dial: '+44', name: 'Royaume-Uni' },
  { cc: 'us', dial: '+1', name: 'USA / Canada' }
];

function flagUrl(cc) { return `https://flagcdn.com/24x18/${cc}.png`; }

function initMojolaPhoneField(group) {
  const codeInputId = group.dataset.codeId;
  const codeInput = document.getElementById(codeInputId);
  if (!codeInput || group.dataset.mojolaPhoneInit === '1') return;
  group.dataset.mojolaPhoneInit = '1';

  const initialDial = codeInput.value || '+229';
  let current = MOJOLA_PHONE_COUNTRIES.find(c => c.dial === initialDial) || MOJOLA_PHONE_COUNTRIES[0];

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tel-code-btn';
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');

  const menu = document.createElement('div');
  menu.className = 'tel-code-menu';
  menu.setAttribute('role', 'listbox');
  menu.hidden = true;

  function renderButton() {
    btn.innerHTML = `<img src="${flagUrl(current.cc)}" width="22" height="16" alt=""><span class="tel-code-val">${current.dial}</span><svg class="tel-code-caret" viewBox="0 0 20 20" width="13" height="13" aria-hidden="true"><path d="M5 7l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    codeInput.value = current.dial;
  }

  function renderMenu() {
    menu.innerHTML = '';
    MOJOLA_PHONE_COUNTRIES.forEach(c => {
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'tel-code-opt';
      opt.setAttribute('role', 'option');
      opt.innerHTML = `<img src="${flagUrl(c.cc)}" width="22" height="16" alt=""><span class="tel-code-opt-name">${c.name}</span><span class="tel-code-opt-dial">${c.dial}</span>`;
      opt.addEventListener('click', () => {
        current = c;
        renderButton();
        closeMenu();
      });
      menu.appendChild(opt);
    });
  }

  function openMenu() {
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', onDocClick, true);
  }
  function closeMenu() {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClick, true);
  }
  function onDocClick(e) {
    if (!group.contains(e.target)) closeMenu();
  }

  btn.addEventListener('click', () => { menu.hidden ? openMenu() : closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  renderButton();
  renderMenu();
  codeInput.replaceWith(btn, menu, codeInput); // garde le hidden input dans le DOM (lu par le formulaire)
  group.insertBefore(btn, group.firstChild);
  group.insertBefore(menu, btn.nextSibling);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tel-group[data-phone-field]').forEach(initMojolaPhoneField);
});
