/* ============================================================
   GERADOR DE CURRÍCULOS A4 — JavaScript
   ============================================================ */
(function () {
  'use strict';

  // ---------- Constantes ----------
  const STORAGE_KEY = 'curriculo_a4_v1';
  const A4_W_MM = 210, A4_H_MM = 297;
  const PADDING_MM = 14; // padding vertical (14mm top + 14mm bottom = 28)
  const MM_TO_PX = 3.7795275591; // 1mm em px a 96dpi
  const PRINTABLE_PX = (A4_H_MM - PADDING_MM * 2) * MM_TO_PX;
  const SECTION_GAP_PX = 10 * MM_TO_PX * 0.7; // folga para margens entre seções

  const SECTIONS = [
    { key: 'objective',  label: 'Objetivo' },
    { key: 'experience', label: 'Experiência' },
    { key: 'education',  label: 'Formação' },
    { key: 'skills',     label: 'Habilidades' },
    { key: 'languages',  label: 'Idiomas' },
    { key: 'extras',     label: 'Informações extras' },
  ];
  const SIDEBAR_SECTIONS = ['education', 'skills', 'languages'];

  // ---------- Estado ----------
  const state = defaultState();

  function defaultState() {
    return {
      personal: { name: '', phone: '', email: '', city: '', linkedin: '', github: '', photo: '' },
      objective: '',
      education: [],
      experience: [],
      skills: [],
      languages: [],
      extras: { courses: '', certificates: '', projects: '', other: '' },
      settings: {
        template: 'classic',
        primaryColor: '#1f3a5f',
        font: 'modern',
        fontSize: '13',
        showPhoto: true,
        order: ['objective', 'experience', 'education', 'skills', 'languages', 'extras'],
      },
    };
  }

  // ---------- Elementos DOM ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const form = $('#resumeForm');
  const resumeEl = $('#resume');
  let measureResume = $('#measureResume');
  const previewWrap = $('#previewWrap');
  const toastEl = $('#toast');

  // ---------- Utilidades ----------
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2000);
  }

  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function getByPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }
  function setByPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o[k] = o[k] || {}), obj);
    target[last] = value;
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function nl2br(str) { return escapeHtml(str).replace(/\n/g, '<br>'); }

  function linesFromTextarea(text) {
    if (!text) return [];
    return String(text).split('\n').map(l => l.trim()).filter(Boolean);
  }

  // ---------- Persistência ----------
  let saveTimer;
  function save(silent) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (!silent) toast('Alterações salvas automaticamente.');
    } catch (e) {
      if (!silent) toast('Não foi possível salvar no navegador.');
    }
  }
  function scheduleAutoSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => save(true), 500);
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      // mescla cuidadosamente para não quebrar com versões antigas
      Object.assign(state, deepClone(defaultState()));
      Object.keys(data).forEach(k => {
        if (typeof state[k] === 'object' && state[k] !== null && !Array.isArray(state[k])) {
          state[k] = Object.assign(state[k], data[k] || {});
        } else {
          state[k] = data[k];
        }
      });
      return true;
    } catch (e) { return false; }
  }
  function downloadJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'curriculo.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Currículo salvo como arquivo.');
  }
  function uploadJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          Object.assign(state, deepClone(defaultState()));
          Object.keys(data).forEach(k => {
            if (typeof state[k] === 'object' && state[k] !== null && !Array.isArray(state[k])) {
              state[k] = Object.assign(state[k], data[k] || {});
            } else {
              state[k] = data[k];
            }
          });
          syncFormFromState();
          render();
          save(true);
          toast('Currículo carregado.');
        } catch (e) { toast('Arquivo inválido.'); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // ---------- Abas / etapas ----------
  const TOTAL_STEPS = 7;
  let currentStep = 1;

  function buildStepTabs() {
    const list = $('#stepList');
    const labels = ['Dados', 'Objetivo', 'Formação', 'Experiência', 'Habilidades', 'Idiomas', 'Extras'];
    list.innerHTML = '';
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'step-tab';
      btn.dataset.step = String(i);
      btn.innerHTML = `<span class="num">${i}</span><span class="lbl">${labels[i - 1]}</span>`;
      btn.addEventListener('click', () => goToStep(i));
      li.appendChild(btn);
      list.appendChild(li);
    }
  }

  function goToStep(n) {
    currentStep = Math.max(1, Math.min(TOTAL_STEPS, n));
    $$('.step').forEach(fs => { fs.hidden = Number(fs.dataset.step) !== currentStep; });
    $$('.step-tab').forEach(t => {
      const s = Number(t.dataset.step);
      t.classList.toggle('is-active', s === currentStep);
      t.classList.toggle('is-done', s < currentStep);
    });
    $('#btnPrev').disabled = currentStep === 1;
    $('#btnNext').textContent = currentStep === TOTAL_STEPS ? 'Concluído ✓' : 'Próxima →';
    $('#stepIndicator').textContent = `Etapa ${currentStep} de ${TOTAL_STEPS}`;
  }

  // ---------- Construção dinâmica de listas ----------
  function makeField(cls, label, inputHtml) {
    return `<div class="field"><label>${escapeHtml(label)}</label>${inputHtml}</div>`;
  }

  function renderEducationList() {
    const wrap = $('#educationList');
    wrap.innerHTML = '';
    if (state.education.length === 0) addEducation(true);
    state.education.forEach((edu, i) => {
      wrap.appendChild(buildItemCard('Formação ' + (i + 1), () => removeItem('education', i), [
        makeField('', 'Curso', `<input type="text" data-list="education" data-i="${i}" data-k="course" value="${escapeHtml(edu.course)}" placeholder="Ex.: Análise e Desenvolvimento de Sistemas">`),
        makeField('', 'Instituição', `<input type="text" data-list="education" data-i="${i}" data-k="institution" value="${escapeHtml(edu.institution)}" placeholder="Ex.: Universidade Federal">`),
        makeField('', 'Período', `<input type="text" data-list="education" data-i="${i}" data-k="period" value="${escapeHtml(edu.period)}" placeholder="Ex.: 2020 – 2023 ou Cursando">`),
      ].join('')));
    });
  }

  function renderExperienceList() {
    const wrap = $('#experienceList');
    wrap.innerHTML = '';
    if (state.experience.length === 0) addExperience(true);
    state.experience.forEach((exp, i) => {
      wrap.appendChild(buildItemCard('Experiência ' + (i + 1), () => removeItem('experience', i), [
        makeField('', 'Cargo', `<input type="text" data-list="experience" data-i="${i}" data-k="role" value="${escapeHtml(exp.role)}" placeholder="Ex.: Desenvolvedor Front-end">`),
        makeField('', 'Empresa', `<input type="text" data-list="experience" data-i="${i}" data-k="company" value="${escapeHtml(exp.company)}" placeholder="Ex.: Empresa XYZ">`),
        makeField('', 'Período', `<input type="text" data-list="experience" data-i="${i}" data-k="period" value="${escapeHtml(exp.period)}" placeholder="Ex.: Jan/2022 – Atual">`),
        makeField('', 'Descrição das atividades', `<textarea rows="3" data-list="experience" data-i="${i}" data-k="description" placeholder="Descreva suas principais atividades e conquistas.">${escapeHtml(exp.description)}</textarea>`),
      ].join('')));
    });
  }

  function renderLanguagesList() {
    const wrap = $('#languagesList');
    wrap.innerHTML = '';
    if (state.languages.length === 0) addLanguage(true);
    state.languages.forEach((lang, i) => {
      wrap.appendChild(buildItemCard('Idioma ' + (i + 1), () => removeItem('languages', i), [
        `<div class="field-row">
          <div class="field"><label>Idioma</label><input type="text" data-list="languages" data-i="${i}" data-k="name" value="${escapeHtml(lang.name)}" placeholder="Ex.: Inglês"></div>
          <div class="field"><label>Nível</label>
            <select data-list="languages" data-i="${i}" data-k="level">
              ${['Básico','Intermediário','Avançado','Fluente','Nativo'].map(l =>
                `<option ${lang.level === l ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
          </div>
        </div>`
      ].join('')));
    });
  }

  function buildItemCard(title, onRemove, innerHtml) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-card__head">
        <span>${escapeHtml(title)}</span>
        <button type="button" class="btn-remove" aria-label="Remover">×</button>
      </div>
      ${innerHtml}`;
    card.querySelector('.btn-remove').addEventListener('click', onRemove);
    return card;
  }

  function addEducation(skipRender) {
    state.education.push({ course: '', institution: '', period: '' });
    if (!skipRender) { renderEducationList(); scheduleAutoSave(); render(); }
  }
  function addExperience(skipRender) {
    state.experience.push({ role: '', company: '', period: '', description: '' });
    if (!skipRender) { renderExperienceList(); scheduleAutoSave(); render(); }
  }
  function addLanguage(skipRender) {
    state.languages.push({ name: '', level: 'Intermediário' });
    if (!skipRender) { renderLanguagesList(); scheduleAutoSave(); render(); }
  }
  function removeItem(list, i) {
    state[list].splice(i, 1);
    if (state[list].length === 0) {
      if (list === 'education') addEducation(true);
      if (list === 'experience') addExperience(true);
      if (list === 'languages') addLanguage(true);
    }
    if (list === 'education') renderEducationList();
    if (list === 'experience') renderExperienceList();
    if (list === 'languages') renderLanguagesList();
    scheduleAutoSave();
    render();
  }

  // ---------- Habilidades ----------
  function renderSkills() {
    const list = $('#skillsList');
    list.innerHTML = '';
    if (state.skills.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'chips-empty';
      empty.textContent = 'Nenhuma habilidade adicionada ainda.';
      list.appendChild(empty);
      return;
    }
    state.skills.forEach((skill, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${escapeHtml(skill)}</span><button type="button" aria-label="Remover">×</button>`;
      li.querySelector('button').addEventListener('click', () => {
        state.skills.splice(i, 1);
        renderSkills(); scheduleAutoSave(); render();
      });
      list.appendChild(li);
    });
  }
  function addSkillFromInput() {
    const input = $('#skillInput');
    const val = input.value.trim();
    if (!val) return;
    val.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
      if (!state.skills.some(x => x.toLowerCase() === s.toLowerCase())) state.skills.push(s);
    });
    input.value = '';
    renderSkills(); scheduleAutoSave(); render();
  }

  // ---------- Ordem das seções ----------
  function renderOrderList() {
    const list = $('#sectionOrder');
    list.innerHTML = '';
    state.settings.order.forEach(key => {
      const sec = SECTIONS.find(s => s.key === key);
      if (!sec) return;
      const li = document.createElement('li');
      li.className = 'order-item';
      li.draggable = true;
      li.dataset.key = key;
      li.innerHTML = `<span class="handle">⠿</span><span>${sec.label}</span>`;
      li.addEventListener('dragstart', () => li.classList.add('dragging'));
      li.addEventListener('dragend', () => li.classList.remove('dragging'));
      li.addEventListener('dragover', (e) => { e.preventDefault(); li.classList.add('drag-over'); });
      li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        li.classList.remove('drag-over');
        const dragging = $('.order-item.dragging');
        if (!dragging || dragging === li) return;
        const keys = $$('.order-item', list).map(el => el.dataset.key);
        const fromIdx = keys.indexOf(dragging.dataset.key);
        const toIdx = keys.indexOf(li.dataset.key);
        keys.splice(toIdx, 0, keys.splice(fromIdx, 1)[0]);
        state.settings.order = keys;
        renderOrderList(); scheduleAutoSave(); render();
      });
      list.appendChild(li);
    });
  }

  // ---------- Sincronização formulário <-> estado ----------
  function syncFormFromState() {
    $$('[data-path]', form).forEach(el => {
      const path = el.dataset.path;
      const val = getByPath(state, path);
      if (el.type === 'checkbox') el.checked = !!val;
      else el.value = val == null ? '' : val;
    });
    renderEducationList();
    renderExperienceList();
    renderLanguagesList();
    renderSkills();
    renderOrderList();
    updatePhotoButton();
  }

  function bindFormEvents() {
    // campos simples (data-path)
    form.addEventListener('input', (e) => {
      const el = e.target;
      if (el.dataset && el.dataset.path) {
        const val = el.type === 'checkbox' ? el.checked : el.value;
        setByPath(state, el.dataset.path, val);
        scheduleAutoSave(); render();
      }
      if (el.dataset && el.dataset.list) {
        const { list, i, k } = el.dataset;
        state[list][Number(i)][k] = el.value;
        scheduleAutoSave(); render();
      }
    });
    form.addEventListener('change', (e) => {
      const el = e.target;
      if (el.dataset && el.dataset.path) {
        const val = el.type === 'checkbox' ? el.checked : el.value;
        setByPath(state, el.dataset.path, val);
        scheduleAutoSave(); render();
      }
    });

    // botões de adicionar
    $$('[data-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.add;
        if (t === 'education') addEducation();
        if (t === 'experience') addExperience();
        if (t === 'languages') addLanguage();
      });
    });

    // navegação
    $('#btnPrev').addEventListener('click', () => goToStep(currentStep - 1));
    $('#btnNext').addEventListener('click', () => goToStep(currentStep + 1));

    // habilidades
    $('#btnAddSkill').addEventListener('click', addSkillFromInput);
    $('#skillInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addSkillFromInput(); }
    });

    // foto
    $('#f-photo').addEventListener('change', handlePhoto);
    $('#btnRemovePhoto').addEventListener('click', removePhoto);

    // ferramentas do topo
    $('#btnPrint').addEventListener('click', () => {
      // garante render mais recente antes de imprimir
      render();
      setTimeout(() => window.print(), 100);
    });
    $('#btnSave').addEventListener('click', () => { save(); downloadJSON(); });
    $('#btnLoad').addEventListener('click', uploadJSON);
    $('#btnClear').addEventListener('click', clearAll);

    // zoom
    $('#zoomIn').addEventListener('click', () => setZoom(zoom + 0.1));
    $('#zoomOut').addEventListener('click', () => setZoom(zoom - 0.1));
  }

  function clearAll() {
    if (!confirm('Tem certeza que deseja limpar todos os campos? Esta ação não pode ser desfeita.')) return;
    const fresh = defaultState();
    Object.keys(state).forEach(k => delete state[k]);
    Object.assign(state, fresh);
    syncFormFromState();
    render();
    save(true);
    toast('Formulário limpo.');
  }

  // ---------- Foto ----------
  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Selecione um arquivo de imagem.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // redimensiona para no máximo 400x400 para economizar localStorage
        const size = 400;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        // corta quadrado centralizado
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        state.personal.photo = canvas.toDataURL('image/jpeg', 0.85);
        updatePhotoButton();
        scheduleAutoSave(); render();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  function removePhoto() {
    state.personal.photo = '';
    $('#f-photo').value = '';
    updatePhotoButton();
    scheduleAutoSave(); render();
  }
  function updatePhotoButton() {
    $('#btnRemovePhoto').hidden = !state.personal.photo;
  }

  // ---------- Renderização do currículo ----------
  function buildHeadHtml() {
    const p = state.personal;
    const s = state.settings;
    const photoHtml = (s.showPhoto && p.photo)
      ? `<img class="r-head__photo" src="${p.photo}" alt="Foto de ${escapeHtml(p.name)}">` : '';

    const contactParts = [];
    if (p.phone) contactParts.push(`<span>📞 ${escapeHtml(p.phone)}</span>`);
    if (p.email) contactParts.push(`<span>✉️ <a href="mailto:${encodeURIComponent(p.email)}">${escapeHtml(p.email)}</a></span>`);
    if (p.city) contactParts.push(`<span>📍 ${escapeHtml(p.city)}</span>`);
    if (p.linkedin) {
      const url = normalizeUrl(p.linkedin, 'linkedin.com');
      contactParts.push(`<span>🔗 <a href="${url}" target="_blank" rel="noopener">${escapeHtml(prettyUrl(p.linkedin))}</a></span>`);
    }
    if (p.github) {
      const url = normalizeUrl(p.github, 'github.com');
      contactParts.push(`<span>🐙 <a href="${url}" target="_blank" rel="noopener">${escapeHtml(prettyUrl(p.github))}</a></span>`);
    }

    return `
      <header class="r-head">
        ${photoHtml}
        <div class="r-head__info">
          <h1 class="r-name">${escapeHtml(p.name) || 'Seu Nome'}</h1>
          <p class="r-contact">${contactParts.join('')}</p>
        </div>
      </header>`;
  }

  function normalizeUrl(str, fallbackDomain) {
    const trimmed = String(str).trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://' + trimmed.replace(/^\/+/, '');
  }
  function prettyUrl(str) {
    return String(str).replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }

  function buildSectionHtml(key) {
    let body = '';
    switch (key) {
      case 'objective': {
        body = state.objective
          ? `<p class="r-text">${nl2br(state.objective)}</p>`
          : `<p class="r-empty">Adicione seu objetivo profissional.</p>`;
        break;
      }
      case 'experience': {
        if (state.experience.length === 0 || state.experience.every(e => !e.role && !e.company)) {
          body = `<p class="r-empty">Adicione suas experiências profissionais.</p>`;
        } else {
          body = state.experience.filter(e => e.role || e.company || e.description).map(e => `
            <div class="r-item">
              <div class="r-item__head">
                <div>
                  <p class="r-item__title">${escapeHtml(e.role || 'Cargo')}</p>
                  <p class="r-item__sub">${escapeHtml(e.company || '')}</p>
                </div>
                <span class="r-item__period">${escapeHtml(e.period || '')}</span>
              </div>
              ${e.description ? `<p class="r-item__desc">${nl2br(e.description)}</p>` : ''}
            </div>`).join('');
        }
        break;
      }
      case 'education': {
        if (state.education.length === 0 || state.education.every(e => !e.course && !e.institution)) {
          body = `<p class="r-empty">Adicione sua formação acadêmica.</p>`;
        } else {
          body = state.education.filter(e => e.course || e.institution).map(e => `
            <div class="r-item">
              <div class="r-item__head">
                <div>
                  <p class="r-item__title">${escapeHtml(e.course || 'Curso')}</p>
                  <p class="r-item__sub">${escapeHtml(e.institution || '')}</p>
                </div>
                <span class="r-item__period">${escapeHtml(e.period || '')}</span>
              </div>
            </div>`).join('');
        }
        break;
      }
      case 'skills': {
        if (state.skills.length === 0) {
          body = `<p class="r-empty">Adicione suas habilidades.</p>`;
        } else {
          body = `<ul class="r-skills">${state.skills.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`;
        }
        break;
      }
      case 'languages': {
        if (state.languages.length === 0 || state.languages.every(l => !l.name)) {
          body = `<p class="r-empty">Adicione os idiomas que você fala.</p>`;
        } else {
          body = `<ul class="r-languages">${
            state.languages.filter(l => l.name).map(l =>
              `<li><span>${escapeHtml(l.name)}</span><span class="r-lang-level">${escapeHtml(l.level || '')}</span></li>`
            ).join('')
          }</ul>`;
        }
        break;
      }
      case 'extras': {
        const blocks = [];
        const courses = linesFromTextarea(state.extras.courses);
        const certs = linesFromTextarea(state.extras.certificates);
        const projects = linesFromTextarea(state.extras.projects);
        const other = state.extras.other ? state.extras.other.trim() : '';
        if (courses.length) blocks.push(`<p class="r-item__title" style="font-size:11.5px;margin:4px 0 2px;">Cursos</p><ul class="r-lines">${courses.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`);
        if (certs.length) blocks.push(`<p class="r-item__title" style="font-size:11.5px;margin:4px 0 2px;">Certificados</p><ul class="r-lines">${certs.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`);
        if (projects.length) blocks.push(`<p class="r-item__title" style="font-size:11.5px;margin:4px 0 2px;">Projetos</p><ul class="r-lines">${projects.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`);
        if (other) blocks.push(`<p class="r-item__title" style="font-size:11.5px;margin:4px 0 2px;">Outras informações</p><p class="r-text" style="font-size:12px;">${nl2br(other)}</p>`);
        body = blocks.length ? blocks.join('') : `<p class="r-empty">Cursos, certificados, projetos ou outras informações.</p>`;
        break;
      }
    }
    const label = SECTIONS.find(s => s.key === key).label;
    return `<section class="r-section" data-key="${key}" data-column="${SIDEBAR_SECTIONS.includes(key) ? 'side' : 'main'}">
      <h2 class="r-section__title">${escapeHtml(label)}</h2>
      <div class="r-section__body">${body}</div>
    </section>`;
  }

  function createPageShell(pageNum) {
    const article = document.createElement('article');
    article.className = `resume theme-${state.settings.template} font-${state.settings.font}`;
    article.style.fontSize = state.settings.fontSize + 'px';
    article.style.setProperty('--accent', state.settings.primaryColor);
    article.dataset.page = String(pageNum);
    return article;
  }

  function getColumnContainer(article, key) {
    if (state.settings.template === 'modern') {
      let aside = article.querySelector('.r-aside');
      let main = article.querySelector('.r-main');
      if (!aside) {
        aside = document.createElement('div');
        aside.className = 'r-aside';
        main = document.createElement('div');
        main.className = 'r-main';
        article.appendChild(aside);
        article.appendChild(main);
        // cabeçalho vai no aside
        aside.insertAdjacentHTML('beforeend', buildHeadHtml());
      }
      return SIDEBAR_SECTIONS.includes(key) ? aside : main;
    }
    return article;
  }

  function ensureHead(article) {
    if (state.settings.template === 'modern') {
      getColumnContainer(article, 'education'); // cria aside/main+head
    } else {
      article.insertAdjacentHTML('beforeend', buildHeadHtml());
    }
  }

  function resetArticleForMeasure() {
    // remove qualquer shell de medição de paginações anteriores
    $$('#measure .resume').forEach((el) => el.remove());
    measureResume = createPageShell(1);
    $('#measure').appendChild(measureResume);
    ensureHead(measureResume);
  }

  // Calcula a quantidade de páginas e distribui seções.
  function paginate() {
    resetArticleForMeasure();
    const pages = [[]];
    let currentArticle = measureResume;

    for (const key of state.settings.order) {
      const html = buildSectionHtml(key);
      const container = getColumnContainer(currentArticle, key);
      const before = currentArticle.scrollHeight;
      container.insertAdjacentHTML('beforeend', html);
      const after = currentArticle.scrollHeight;
      if (after > PRINTABLE_PX + SECTION_GAP_PX) {
        // estourou: remover a seção e colocá-la em nova página
        container.lastElementChild.remove();
        // nova página: cria um shell de medição próprio
        const nextShell = createPageShell(pages.length + 1);
        $('#measure').appendChild(nextShell);
        ensureHead(nextShell);
        const nextContainer = getColumnContainer(nextShell, key);
        nextContainer.insertAdjacentHTML('beforeend', html);
        pages.push([key]);
        currentArticle = nextShell;
      } else {
        pages[pages.length - 1].push(key);
      }
    }

    return pages;
  }

  function renderPreviewPages(pages) {
    previewWrap.innerHTML = '';
    pages.forEach((keys, i) => {
      const article = createPageShell(i + 1);
      ensureHead(article);
      keys.forEach(key => {
        const container = getColumnContainer(article, key);
        container.insertAdjacentHTML('beforeend', buildSectionHtml(key));
      });
      previewWrap.appendChild(article);
    });
    applyZoom();
    updatePageStatus(pages.length);
  }

  function updatePageStatus(count) {
    const dot = $('#pageDot');
    const text = $('#pageStatusText');
    const status = $('.page-status');
    status.classList.remove('is-warning', 'is-danger');
    if (count <= 1) {
      text.textContent = '1 página';
    } else if (count === 2) {
      text.textContent = '2 páginas';
      status.classList.add('is-warning');
    } else {
      text.textContent = count + ' páginas — muito conteúdo!';
      status.classList.add('is-danger');
    }
  }

  function render() {
    const pages = paginate();
    renderPreviewPages(pages);
  }

  // ---------- Zoom da pré-visualização ----------
  let zoom = 0.8;
  function applyZoom() {
    $$('#previewWrap .resume').forEach(el => {
      el.style.transform = `scale(${zoom})`;
      el.style.marginBottom = `${-(1 - zoom) * 297 * MM_TO_PX}px`;
    });
    $('#zoomLabel').textContent = Math.round(zoom * 100) + '%';
  }
  function setZoom(v) {
    zoom = Math.max(0.4, Math.min(1.5, v));
    applyZoom();
  }

  // ---------- Init ----------
  function init() {
    buildStepTabs();
    bindFormEvents();
    const loaded = load();
    syncFormFromState();
    goToStep(1);
    render();
    if (loaded) toast('Currículo carregado do navegador.');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
