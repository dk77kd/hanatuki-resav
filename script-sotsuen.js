'use strict';

/* ─── EmailJS 設定（emailjs.com で取得した値を入力） ─── */
const EMAILJS_PUBLIC_KEY  = 'wRhkbtHzG26zBc25r';
const EMAILJS_SERVICE_ID  = 'service_3l9c5cf';
const EMAILJS_TEMPLATE_ID = 'template_nghblif';

/* ─── State ─── */
const state = {
  album: null, albumLabel: '', albumPrice: 0, albumQty: 1,
  options: {},
  subjects: [{ gender: null, age: '' }],
  optionQty: {},
  dressingCount: 0,
  dressing: [],        // [{ relation:'', ageGroup:'adult', selectedOpts:{} }]
  date: null, dateLabel: '',
  time: null,
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
};

/* ─── Constants ─── */
const BASE_PRICE = 63300;

const ALBUM_LABELS = {
  album_none: 'なし',
  album_a3:   'A３スクエアアルバム＆全データプランセット',
  album_a4:   'A４アルバム＆全データプランセット',
  album_3men: '３面スクエアアルバム＆全データプランセット',
  album_3dai: '３面台紙',
  album_2dai: '２面台紙',
  album_a5:   'Ａ５ブック',
};

const OPTION_LABELS = {
  location:         '寒川の神社ロケーション撮影',
  video_studio:     'スタジオ動画撮影プラン（1分30秒ほど）',
  video_location:   'ロケーション動画撮影プラン（1分30秒ほど）',
  video_studio_location: 'スタジオ＆ロケーション動画撮影プラン（2分ほど）',
  nihongami:        '日本髪オプション',
  cleaning:         '着物クリーニング保険',
};

const RELATION_LABELS = {
  father: '父', mother: '母', grandpa: '祖父', grandma: '祖母',
  brother: '兄弟', sister: '姉妹', other: 'その他',
};
const RELATION_GENDER = {
  father: 'male', mother: 'female', grandpa: 'male', grandma: 'female',
  brother: 'brother', sister: 'sister', other: 'other',
};
const DRESSING_OPTS = {
  male: [
    { key: 'kitsuke_rental_m',    label: 'レンタルアンサンブル着付け24,000円（50％オフ）', price: 12000 },
    { key: 'kitsuke_mochikomi_m', label: '持込アンサンブル着付け19,600円（30％オフ）',     price: 13720 },
  ],
  female: [
    { key: 'kitsuke_rental_f',    label: '訪問着レンタル着付け33,000円（50％オフ）', price: 16500 },
    { key: 'kitsuke_mochikomi_f', label: '訪問着持込着付け28,600円（30％オフ）',     price: 20020 },
    { key: 'hair_f',              label: 'ヘアセット',                              price: 5500  },
  ],
  sister: [
    { key: 'kitsuke_rental_s',    label: 'レンタル着付けヘアセット36,300円（30％オフ）', price: 25410 },
    { key: 'kitsuke_mochikomi_s', label: '持込着付けヘアセット31,900円（30％オフ）',     price: 22330 },
  ],
  brother: [
    { key: 'kitsuke_rental_b',    label: '着物レンタル着付け36,300円（30％オフ）', price: 25410 },
    { key: 'kitsuke_mochikomi_b', label: '持込着付け31,900円（30％オフ）',         price: 22330 },
  ],
  other: [
    { key: 'kitsuke_rental_m',    label: 'レンタルアンサンブル着付け24,000円（50％オフ）', price: 12000 },
    { key: 'kitsuke_mochikomi_m', label: '持込アンサンブル着付け19,600円（30％オフ）',     price: 13720 },
    { key: 'kitsuke_rental_f',    label: '訪問着レンタル着付け33,000円（50％オフ）', price: 16500 },
    { key: 'kitsuke_mochikomi_f', label: '訪問着持込着付け28,600円（30％オフ）',     price: 20020 },
    { key: 'hair_f',              label: 'ヘアセット',                              price: 5500  },
  ],
};

const JP_WD      = ['日','月','火','水','木','金','土'];
const FULL_SLOTS = ['2026-06-14','2026-06-21','2026-07-05'];
const TIME_SLOTS = ['7:45','9:00','10:15','11:15','12:30','13:30','14:30'];
const FULL_TIMES = { '2026-06-19': ['11:00','13:00'] };

/* ─── Step navigation ─── */
function goToStep(n) {
  if (n > 1 && !validateStep(n - 1)) return;

  const steps = document.querySelectorAll('.step');
  const lines = document.querySelectorAll('.step-line');
  steps.forEach((s, i) => {
    s.classList.remove('active', 'done');
    const sn = i + 1;
    if (sn < n) s.classList.add('done');
    if (sn === n) s.classList.add('active');
  });
  lines.forEach((l, i) => {
    l.classList.toggle('done', (i + 1) < n);
  });
  for (let i = 1; i <= 5; i++) {
    document.getElementById('step' + i).classList.remove('active');
  }
  if (n <= 5) {
    document.getElementById('step' + n).classList.add('active');
    if (n === 2) goToOptionSubStep(1);
    if (n === 5) buildConfirmTable();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─── Option sub-step navigation ─── */
function goToOptionSubStep(n) {
  document.querySelectorAll('#step2 .substep').forEach((el, i) => {
    el.classList.toggle('active', i + 1 === n);
  });
  document.querySelectorAll('#step2SubIndicator .substep-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i + 1 === n);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─── Validation ─── */
function validateStep(n) {
  if (n === 1) {
    let ok = true;
    state.subjects.forEach((s, i) => {
      if (!s.gender) { show(`subjectGenderError-${i}`); ok = false; }
      else hide(`subjectGenderError-${i}`);
      if (!s.age || !s.age.trim()) { show(`subjectAgeError-${i}`); ok = false; }
      else hide(`subjectAgeError-${i}`);
    });
    return ok;
  }
  if (n === 3) {
    if (!state.date) { show('dateError'); return false; }
    if (!state.time) { show('timeError'); return false; }
    hide('dateError'); hide('timeError');
  }
  if (n === 4) {
    let ok = true;
    [
      { id: 'lastName',      err: 'lastNameError',      fn: v => v.trim() !== '' },
      { id: 'firstName',     err: 'firstNameError',     fn: v => v.trim() !== '' },
      { id: 'lastNameKana',  err: 'lastNameKanaError',  fn: v => /^[ァ-ヶー\s]+$/.test(v.trim()) },
      { id: 'firstNameKana', err: 'firstNameKanaError', fn: v => /^[ァ-ヶー\s]+$/.test(v.trim()) },
      { id: 'phone',         err: 'phoneError',         fn: v => /^[\d\-\+\(\)\s]{10,15}$/.test(v.trim()) },
      { id: 'zipcode',       err: 'zipcodeError',       fn: v => /^\d{3}-?\d{4}$/.test(v.trim()) },
      { id: 'address',       err: 'addressError',       fn: v => v.trim() !== '' },
      { id: 'email',         err: 'emailError',         fn: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    ].forEach(({ id, err, fn }) => {
      const el = document.getElementById(id);
      if (!fn(el.value)) { el.classList.add('invalid'); show(err); ok = false; }
      else { el.classList.remove('invalid'); hide(err); }
    });
    const agree = document.getElementById('agreeCheck');
    if (!agree.checked) { show('agreeError'); ok = false; } else hide('agreeError');
    return ok;
  }
  return true;
}

/* ─── Step 1: Shooting info ─── */
function renderSubjectList() {
  const list = document.getElementById('subjectList');
  list.innerHTML = '';
  state.subjects.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.innerHTML = `
      <div class="form-row">
        <label class="form-label">性別<span class="badge req">必須</span></label>
        <div class="age-toggle-group">
          <button type="button" class="age-toggle${s.gender === '女の子' ? ' selected' : ''}" data-gender="女の子" onclick="toggleSubjectGender(this,${i})">女の子</button>
          <button type="button" class="age-toggle${s.gender === '男の子' ? ' selected' : ''}" data-gender="男の子" onclick="toggleSubjectGender(this,${i})">男の子</button>
        </div>
        <p class="error-msg" id="subjectGenderError-${i}">性別をお選びください</p>
      </div>
      <div class="form-row" style="margin-bottom:0">
        <label class="form-label">年齢<span class="badge req">必須</span></label>
        <input type="text" placeholder="例：10歳" value="${s.age || ''}" oninput="updateSubjectAge(this,${i})">
        <p class="error-msg" id="subjectAgeError-${i}">年齢をご入力ください</p>
      </div>
    `;
    list.appendChild(card);
  });
}

function toggleSubjectGender(btn, i) {
  btn.closest('.subject-card').querySelectorAll('[data-gender]').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.subjects[i].gender = btn.dataset.gender;
  hide(`subjectGenderError-${i}`);
}

function updateSubjectAge(input, i) {
  state.subjects[i].age = input.value;
  if (input.value.trim()) hide(`subjectAgeError-${i}`);
}

/* ─── Step 2-1: Family dressing ─── */
function toggleDressingCount(btn) {
  document.querySelectorAll('#dressingCountGroup .age-toggle').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  const count = parseInt(btn.dataset.count, 10);
  state.dressingCount = count;
  while (state.dressing.length < count) state.dressing.push({ relation: '', ageGroup: 'adult', selectedOpts: {} });
  state.dressing = state.dressing.slice(0, count);
  renderDressingList();
}

function renderDressingList() {
  const list = document.getElementById('dressingList');
  list.innerHTML = '';
  if (state.dressingCount === 0) return;
  state.dressing.forEach((d, i) => {
    const relEntries = [
      ['', '選択してください'], ['father','父'], ['mother','母'],
      ['grandpa','祖父'], ['grandma','祖母'], ['brother','兄弟'],
      ['sister','姉妹'], ['other','その他'],
    ];
    const relOpts = relEntries.map(([v, lbl]) =>
      `<option value="${v}"${d.relation === v ? ' selected' : ''}>${lbl}</option>`
    ).join('');
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.innerHTML = `
      <p class="subject-title">お支度：${i + 1}人目</p>
      <div class="form-row">
        <label class="form-label">ご主役との関係<span class="badge req">必須</span></label>
        <select id="dressing-rel-${i}" onchange="onDressingRelChange(this,${i})">${relOpts}</select>
        <p class="error-msg" id="dressingRelError-${i}">ご主役との関係をお選びください</p>
      </div>
      <div class="form-row">
        <label class="form-label">年齢区分<span class="badge req">必須</span></label>
        <select id="dressing-age-${i}" onchange="state.dressing[${i}].ageGroup=this.value">
          <option value="adult"${d.ageGroup === 'adult' ? ' selected' : ''}>大人</option>
          <option value="child"${d.ageGroup === 'child' ? ' selected' : ''}>子供</option>
        </select>
      </div>
      <div id="dressing-opts-${i}"></div>
    `;
    list.appendChild(card);
    renderDressingOpts(i);
  });
}

function onDressingRelChange(sel, i) {
  state.dressing[i].relation = sel.value;
  state.dressing[i].selectedOpts = {};
  hide(`dressingRelError-${i}`);
  renderDressingOpts(i);
  updatePriceTotal();
}

function renderDressingOpts(i) {
  const d = state.dressing[i];
  const container = document.getElementById(`dressing-opts-${i}`);
  if (!d.relation) { container.innerHTML = ''; return; }
  const gender = RELATION_GENDER[d.relation];
  const opts = DRESSING_OPTS[gender] || [];
  container.innerHTML = `
    <div class="form-row" style="margin-bottom:0">
      <label class="form-label">オプション<span class="badge opt">任意</span></label>
      <div class="option-toggle-group">
        ${opts.map(o => `
          <button type="button" class="option-toggle${d.selectedOpts[o.key] ? ' selected' : ''}"
            data-key="${o.key}" data-price="${o.price}"
            onclick="toggleDressingOpt(this,${i})">
            <span class="opt-check">✓</span>
            <span class="opt-label">${o.label}</span>
            <span class="opt-price">¥${o.price.toLocaleString('ja-JP')}（税込）</span>
          </button>`).join('')}
      </div>
    </div>
  `;
}

function toggleDressingOpt(btn, i) {
  const key   = btn.dataset.key;
  const price = parseInt(btn.dataset.price, 10);
  const label = btn.querySelector('.opt-label').textContent;
  if (btn.classList.contains('selected')) {
    btn.classList.remove('selected');
    delete state.dressing[i].selectedOpts[key];
  } else {
    btn.classList.add('selected');
    state.dressing[i].selectedOpts[key] = { label, price };
  }
  updatePriceTotal();
}

/* ─── Step 2-2/2-3: Album + location + sibling ─── */
function toggleAlbum(btn) {
  const wasSelected = btn.classList.contains('selected');
  document.querySelectorAll('[data-option^="album"]').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('[id^="album_"][id$="-qty"]').forEach(row => { row.style.display = 'none'; });
  if (wasSelected) {
    state.album = null; state.albumLabel = ''; state.albumPrice = 0; state.albumQty = 1;
  } else {
    btn.classList.add('selected');
    const key       = btn.dataset.option;
    const unitPrice = parseInt(btn.dataset.unitPrice, 10) || 0;
    state.album      = key;
    state.albumLabel = ALBUM_LABELS[key] || '';
    state.albumQty   = 1;
    state.albumPrice = unitPrice;
    if (key !== 'album_none') {
      const qtyRow = document.getElementById(`${key}-qty`);
      if (qtyRow) {
        qtyRow.style.display = 'flex';
        qtyRow.querySelectorAll('.age-toggle').forEach((b, i) => b.classList.toggle('selected', i === 0));
      }
    }
  }
  updatePriceTotal();
}

function setAlbumQty(key, unitPrice, qty, btn) {
  state.albumQty   = qty;
  state.albumPrice = unitPrice * qty;
  btn.closest('.age-toggle-group').querySelectorAll('.age-toggle').forEach((b, i) => {
    b.classList.toggle('selected', i + 1 === qty);
  });
  if (unitPrice > 0) {
    document.getElementById(`${key}-price`).textContent =
      `＋¥${(unitPrice * qty).toLocaleString('ja-JP')}`;
  }
  updatePriceTotal();
}

function toggleQtyOption(btn) {
  const key       = btn.dataset.option;
  const unitPrice = parseInt(btn.dataset.unitPrice, 10);
  const qtyRow    = document.getElementById(`${key}-qty`);
  if (btn.classList.contains('selected')) {
    btn.classList.remove('selected');
    delete state.options[key];
    delete state.optionQty[key];
    qtyRow.style.display = 'none';
  } else {
    btn.classList.add('selected');
    const qty = state.optionQty[key] || 1;
    state.optionQty[key] = qty;
    state.options[key] = { label: OPTION_LABELS[key] || key, price: unitPrice * qty, qty };
    qtyRow.style.display = 'flex';
    qtyRow.querySelectorAll('.age-toggle').forEach((b, i) => {
      b.classList.toggle('selected', i + 1 === qty);
    });
    document.getElementById(`${key}-price`).textContent =
      `¥${(unitPrice * qty).toLocaleString('ja-JP')}`;
  }
  updatePriceTotal();
}

function setOptionQty(key, unitPrice, qty, btn) {
  state.optionQty[key] = qty;
  if (state.options[key]) {
    state.options[key].price = unitPrice * qty;
    state.options[key].qty   = qty;
  }
  btn.closest('.age-toggle-group').querySelectorAll('.age-toggle').forEach((b, i) => {
    b.classList.toggle('selected', i + 1 === qty);
  });
  document.getElementById(`${key}-price`).textContent =
    `¥${(unitPrice * qty).toLocaleString('ja-JP')}`;
  updatePriceTotal();
}

function calcLocationPrice(qty) {
  return 28000 + Math.max(0, qty - 1) * 14000;
}

function toggleCheck(btn) {
  const key = btn.dataset.option;
  if (btn.classList.contains('selected')) {
    btn.classList.remove('selected');
    delete state.options[key];
  } else {
    btn.classList.add('selected');
    const unitPrice = parseInt(btn.dataset.price, 10) || 0;
    const qty       = key === 'location' ? Math.max(1, state.subjects.length) : 1;
    state.options[key] = {
      label: OPTION_LABELS[key] || key,
      price: key === 'location' ? calcLocationPrice(qty) : unitPrice * qty,
      qty:   key === 'location' ? qty : undefined,
    };
  }
  refreshLocationPrice();
  updatePriceTotal();
}

function refreshLocationPrice() {
  const qty = Math.max(1, state.subjects.length);
  const total = calcLocationPrice(qty);
  if (state.options.location) {
    state.options.location.price = total;
    state.options.location.qty   = qty;
  }
  const el = document.getElementById('location-price');
  if (el) {
    el.textContent = qty > 1 ? `＋¥${total.toLocaleString('ja-JP')}（¥28,000＋¥14,000×${qty - 1}名）` : `＋¥${total.toLocaleString('ja-JP')}`;
  }
}

function updatePriceTotal() {
  const album   = state.albumPrice;
  const opts    = Object.values(state.options).reduce((s, o) => s + o.price, 0);
  const dress   = state.dressing.reduce((sum, d) =>
    sum + Object.values(d.selectedOpts).reduce((s, o) => s + o.price, 0), 0);
  const total   = BASE_PRICE + album + opts + dress;
  const text    = '¥' + total.toLocaleString('ja-JP');
  document.querySelectorAll('.price-summary-total').forEach(el => {
    el.textContent = text;
  });
}

/* ─── Step 3: Calendar ─── */
function changeMonth(d) {
  state.calMonth += d;
  if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
  if (state.calMonth < 0)  { state.calMonth = 11; state.calYear--; }
  renderCalendar();
}

function renderCalendar() {
  const { calYear: y, calMonth: m } = state;
  document.getElementById('calMonthLabel').textContent = `${y} / ${m + 1}`;
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';
  JP_WD.forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal-header'; h.textContent = d; grid.appendChild(h);
  });
  const first = new Date(y, m, 1).getDay();
  const days  = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  for (let i = 0; i < first; i++) {
    const e = document.createElement('div'); e.className = 'cal-day empty'; grid.appendChild(e);
  }
  for (let d = 1; d <= days; d++) {
    const cell = document.createElement('div');
    const ds   = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow  = new Date(y, m, d).getDay();
    const past = new Date(y, m, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    cell.className = 'cal-day';
    if (dow === 0) cell.classList.add('sunday');
    if (dow === 6) cell.classList.add('saturday');
    if (past || FULL_SLOTS.includes(ds)) cell.classList.add('disabled');
    if (ds === today.toISOString().slice(0, 10)) cell.classList.add('today');
    if (state.date === ds) cell.classList.add('selected');
    cell.textContent = d;
    if (FULL_SLOTS.includes(ds)) cell.title = '満員';
    if (!past && !FULL_SLOTS.includes(ds))
      cell.addEventListener('click', () => selectDate(ds, y, m, d));
    grid.appendChild(cell);
  }
}

function selectDate(ds, y, m, d) {
  state.date = ds; state.time = null;
  state.dateLabel = `${y}年${m+1}月${d}日（${JP_WD[new Date(y,m,d).getDay()]}）`;
  hide('dateError');
  renderCalendar();
  renderTimes(ds);
}

function renderTimes(ds) {
  const sec  = document.getElementById('timeSection');
  const grid = document.getElementById('timeGrid');
  sec.style.display = 'block'; grid.innerHTML = '';
  const full = FULL_TIMES[ds] || [];
  TIME_SLOTS.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'time-btn';
    if (full.includes(t)) {
      btn.classList.add('full'); btn.textContent = `${t} ×`; btn.disabled = true;
    } else {
      btn.textContent = `${t} ○`;
      if (state.time === t) btn.classList.add('selected');
      btn.addEventListener('click', () => {
        state.time = t;
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        hide('timeError');
      });
    }
    grid.appendChild(btn);
  });
}

/* ─── Step 5: Confirm table ─── */
function buildConfirmTable() {
  const optionLines = [
    `卒園卒業 基本撮影料（＋¥${BASE_PRICE.toLocaleString('ja-JP')}）`,
    state.album && state.album !== 'album_none'
      ? `${state.albumLabel}${state.albumQty > 1 ? ` × ${state.albumQty}` : ''}${state.albumPrice > 0 ? `（＋¥${state.albumPrice.toLocaleString('ja-JP')}）` : ''}`
      : null,
    ...Object.values(state.options).map(o => {
      const qtyStr = o.qty && o.qty > 1 ? ` × ${o.qty}` : '';
      return `${o.label}${qtyStr}（＋¥${o.price.toLocaleString('ja-JP')}）`;
    }),
  ].filter(Boolean);

  const dressingLines = state.dressing.map((d, i) => {
    const relLabel = RELATION_LABELS[d.relation] || '—';
    const ageLabel = d.ageGroup === 'adult' ? '大人' : '子供';
    const opts = Object.values(d.selectedOpts).map(o => o.label).join('、') || 'なし';
    return `${i + 1}人目（${relLabel} / ${ageLabel}）：${opts}`;
  });

  const totalPrice = BASE_PRICE + state.albumPrice +
    Object.values(state.options).reduce((s, o) => s + o.price, 0) +
    state.dressing.reduce((sum, d) =>
      sum + Object.values(d.selectedOpts).reduce((s, o) => s + o.price, 0), 0);

  const subjectLines = state.subjects
    .map(s => `${s.gender || '—'}　${s.age || '—'}`)
    .join('<br>');

  const rows = [
    ['お子様',    subjectLines],
    ['お支度',    state.dressingCount === 0 ? 'なし' : dressingLines.join('<br>')],
    ['Option',    optionLines.length ? optionLines.join('<br>') : 'なし'],
    ['Date',      state.dateLabel],
    ['Time',      state.time],
    ['Name',      `${val('lastName')} ${val('firstName')}`],
    ['Kana',      `${val('lastNameKana')} ${val('firstNameKana')}`],
    ['Tel',       val('phone')],
    ['Zip',       val('zipcode')],
    ['Address',   val('address')],
    ['Email',     val('email')],
    ['Remarks',   val('notes') || '—'],
  ];

  const tableRows = rows.map(([k, v]) =>
    `<tr><th>${k}</th><td>${v || '—'}</td></tr>`
  ).join('');

  const totalRow = `<tr class="total-row">
    <th>お見積り合計</th>
    <td>¥${totalPrice.toLocaleString('ja-JP')}<small style="font-size:12px;color:#8C8078;margin-left:8px;">税込</small></td>
  </tr>`;

  document.getElementById('confirmTable').innerHTML = tableRows + totalRow;
}

function val(id) { return document.getElementById(id).value; }

/* ─── EmailJS 初期化 ─── */
emailjs.init(EMAILJS_PUBLIC_KEY);

/* ─── メール送信 ─── */
async function sendConfirmationEmail(bookingId) {
  // お支度明細
  const dressingLines = state.dressing.map((d, i) => {
    const relLabel = RELATION_LABELS[d.relation] || '—';
    const opts = Object.values(d.selectedOpts || {}).map(o => o.label).join('、');
    return `  ${i + 1}名目：${relLabel} / ${d.ageGroup === 'adult' ? '大人' : '子ども'}${opts ? ' / ' + opts : ''}`;
  });

  // オプション明細
  const optLines = Object.entries(state.options)
    .filter(([, v]) => v)
    .map(([k, v]) => {
      const lbl = OPTION_LABELS[k] || k;
      const qty = v.qty || state.optionQty[k];
      return qty ? `  ${lbl} × ${qty}` : `  ${lbl}`;
    });

  const totalPrice = BASE_PRICE + state.albumPrice +
    Object.values(state.options).reduce((s, o) => s + o.price, 0) +
    state.dressing.reduce((sum, d) =>
      sum + Object.values(d.selectedOpts).reduce((s, o) => s + o.price, 0), 0);

  const body = `
【ご予約番号】${bookingId}

【お子様情報】
${state.subjects.map(s => `  ${s.gender || '未設定'} / ${s.age || '未設定'}`).join('\n')}

【ご家族のお支度】
${state.dressingCount === 0 ? '  なし' : dressingLines.join('\n')}

【オプション】
  卒園卒業 基本撮影料（＋¥${BASE_PRICE.toLocaleString('ja-JP')}）
${optLines.length ? optLines.join('\n') : '  なし'}

【アルバム】${state.album === 'none' || !state.album ? 'アルバムなし' : `${state.albumLabel} × ${state.albumQty}`}

【ご希望日時】${state.dateLabel || ''}　${state.time || ''}

【お名前】${val('lastName')} ${val('firstName')}
【フリガナ】${val('lastNameKana')} ${val('firstNameKana')}
【電話番号】${val('phone')}
【郵便番号】${val('zipcode')}
【住所】${val('address')}
【メールアドレス】${val('email')}
【備考】${val('notes') || 'なし'}

【お見積り合計】¥${totalPrice.toLocaleString('ja-JP')}（税込）

────────────────────
このメールは花とつきの予約フォームから自動送信されています。
ご予約確定のご連絡は改めてスタッフよりご連絡いたします。
`.trim();

  const fullName = val('lastName') + ' ' + val('firstName');

  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email:    val('email'),
    to_name:     fullName,
    booking_id:  bookingId,
    message:     body,
  });
}

/* ─── Submit ─── */
async function submitReservation() {
  const id = 'HT-' + Date.now().toString(36).toUpperCase();
  document.getElementById('bookingId').textContent = `予約番号 : ${id}`;
  document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
  document.getElementById('stepNav').style.display = 'none';
  document.getElementById('stepComplete').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  try {
    await sendConfirmationEmail(id);
  } catch (e) {
    console.error('EmailJS 送信エラー:', e);
  }
}

/* ─── Zipcode lookup ─── */
async function lookupZipcode(input) {
  const raw = input.value.replace(/-/g, '');
  if (raw.length !== 7 || !/^\d{7}$/.test(raw)) return;
  const hint = document.getElementById('zipcodeHint');
  hint.textContent = '住所を検索中…';
  try {
    const res  = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${raw}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const r = data.results[0];
      const addr = document.getElementById('address');
      addr.value = r.address1 + r.address2 + r.address3;
      addr.classList.remove('invalid');
      hide('addressError');
      hint.textContent = '住所を自動入力しました';
    } else {
      hint.textContent = '該当する住所が見つかりませんでした';
    }
  } catch {
    hint.textContent = 'ハイフンありでご入力ください';
  }
}

/* ─── Helpers ─── */
function show(id) { document.getElementById(id).classList.add('visible'); }
function hide(id) { document.getElementById(id).classList.remove('visible'); }

/* ─── Init ─── */
renderSubjectList();
renderCalendar();
updatePriceTotal();
