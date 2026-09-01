'use strict';

// DOM Elements
const searchInput = document.querySelector('#search-input');
const searchClearBtn = document.querySelector('#search-clear');
const devModeToggle = document.querySelector('#dev-mode-toggle');
const devToolbar = document.querySelector('#dev-toolbar');
const loadUnpackedBtn = document.querySelector('#load-unpacked-btn');
const packExtensionBtn = document.querySelector('#pack-extension-btn');
const reloadAllBtn = document.querySelector('#reload-all-btn');

// Sidebar nav
const navMyExtensions = document.querySelector('#nav-my-extensions');
const navShortcuts = document.querySelector('#nav-shortcuts');
const viewExtensions = document.querySelector('#view-extensions');
const viewShortcuts = document.querySelector('#view-shortcuts');
const openWebStoreLink = document.querySelector('#open-web-store-link');

// Views & Lists
const extensionsCount = document.querySelector('#extensions-count');
const extensionsGrid = document.querySelector('#extensions-grid');
const extensionsEmpty = document.querySelector('#extensions-empty');
const emptyMessage = document.querySelector('#empty-message');
const emptyLoadBtn = document.querySelector('#empty-load-btn');
const emptyStoreBtn = document.querySelector('#empty-store-btn');
const shortcutsContainer = document.querySelector('#shortcuts-container');

// Modals
const detailsModal = document.querySelector('#details-modal');
const detailsModalClose = document.querySelector('#details-modal-close');
const modalCloseBtn = document.querySelector('#modal-close-btn');
const modalExtIcon = document.querySelector('#modal-ext-icon');
const modalExtName = document.querySelector('#modal-ext-name');
const modalExtVersion = document.querySelector('#modal-ext-version');
const modalExtDesc = document.querySelector('#modal-ext-desc');
const modalExtId = document.querySelector('#modal-ext-id');
const modalExtManifestVer = document.querySelector('#modal-ext-manifest-ver');
const modalExtPath = document.querySelector('#modal-ext-path');
const modalExtPermissions = document.querySelector('#modal-ext-permissions');
const modalExtHosts = document.querySelector('#modal-ext-hosts');
const modalOpenFolderBtn = document.querySelector('#modal-open-folder-btn');
const modalOpenOptionsBtn = document.querySelector('#modal-open-options-btn');

const packModal = document.querySelector('#pack-modal');
const packModalClose = document.querySelector('#pack-modal-close');
const packModalCancel = document.querySelector('#pack-modal-cancel');
const packModalConfirm = document.querySelector('#pack-modal-confirm');
const packExtSelect = document.querySelector('#pack-ext-select');

// Toast
const toastEl = document.querySelector('#toast');
const toastMessage = document.querySelector('#toast-message');
let toastTimer;

// State
let allExtensions = [];
let currentFilter = '';
let activeSelectedExt = null;

function showToast(msg) {
  if (!toastEl || !toastMessage) return;
  clearTimeout(toastTimer);
  toastMessage.textContent = msg;
  toastEl.style.display = 'block';
  toastTimer = setTimeout(() => {
    toastEl.style.display = 'none';
  }, 2500);
}

function applyThemeColors(appearance = {}) {
  const root = document.documentElement.style;
  root.setProperty('--bg', appearance.background || '#050805');
  root.setProperty('--fg', appearance.foreground || '#8abe85');
  root.setProperty('--accent', appearance.accent || '#69a865');
  root.setProperty('--panel', appearance.panel || '#0a120b');
  root.setProperty('--panel-hover', appearance.panelHover || '#121f14');
  root.setProperty('--border', appearance.border || 'rgba(105, 168, 101, 0.2)');
  root.fontFamily = `"${appearance.font || 'IBM Plex Mono'}", Consolas, monospace`;
}

function renderExtensionCard(ext) {
  const card = document.createElement('div');
  const isEnabled = ext.enabled !== false;
  card.className = `extension-card${isEnabled ? '' : ' disabled'}`;

  // Card Top
  const cardTop = document.createElement('div');
  cardTop.className = 'card-top';

  const iconDiv = document.createElement('div');
  iconDiv.className = 'card-icon';
  if (ext.icon) {
    const img = document.createElement('img');
    img.src = ext.icon;
    img.alt = ext.name;
    iconDiv.appendChild(img);
  } else {
    iconDiv.textContent = (ext.name || 'E')[0].toUpperCase();
  }

  const titleGroup = document.createElement('div');
  titleGroup.className = 'card-title-group';

  const nameEl = document.createElement('div');
  nameEl.className = 'card-name';
  nameEl.title = ext.name;
  nameEl.textContent = ext.name;

  const versionEl = document.createElement('span');
  versionEl.className = 'card-version';
  versionEl.textContent = ext.version || '1.0';
  nameEl.appendChild(versionEl);

  const descEl = document.createElement('div');
  descEl.className = 'card-desc';
  descEl.textContent = ext.description || 'Extensão instalada no Zeos WebBrowser.';

  titleGroup.append(nameEl, descEl);
  cardTop.append(iconDiv, titleGroup);

  // Card Meta (ID & Inspect views)
  const metaDiv = document.createElement('div');
  metaDiv.className = 'card-meta';

  const idRow = document.createElement('div');
  idRow.className = 'card-id-row';

  const idText = document.createElement('span');
  idText.className = 'card-id-text';
  idText.textContent = `ID: ${ext.id}`;
  idText.title = `ID: ${ext.id}`;

  const copyBtn = document.createElement('button');
  copyBtn.className = 'card-copy-btn';
  copyBtn.title = 'Copiar ID';
  copyBtn.textContent = '📋';
  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ext.id);
    showToast('ID da extensão copiado!');
  });

  idRow.append(idText, copyBtn);
  metaDiv.appendChild(idRow);

  // Inspect views
  const inspectRow = document.createElement('div');
  inspectRow.className = 'card-inspect-row';
  inspectRow.innerHTML = '<span>Inspecionar visualizações:</span> ';

  if (ext.hasBackground) {
    const inspectLink = document.createElement('a');
    const bgType = ext.backgroundType === 'service_worker' ? 'service worker' : 'background page';
    inspectLink.className = `inspect-link${isEnabled ? '' : ' inactive'}`;
    inspectLink.textContent = isEnabled ? bgType : `${bgType} (inativa)`;
    inspectLink.href = '#';
    inspectLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (isEnabled && window.zeosExtensions) {
        window.zeosExtensions.inspectBackground(ext.id);
      } else {
        showToast('Ative a extensão para inspecionar o service worker.');
      }
    });
    inspectRow.appendChild(inspectLink);
  } else {
    const noBg = document.createElement('span');
    noBg.className = 'inspect-link inactive';
    noBg.textContent = 'nenhuma';
    inspectRow.appendChild(noBg);
  }

  metaDiv.appendChild(inspectRow);

  // Card Actions
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'card-actions';

  const buttonsGroup = document.createElement('div');
  buttonsGroup.className = 'card-buttons';

  const detailsBtn = document.createElement('button');
  detailsBtn.className = 'card-btn';
  detailsBtn.textContent = 'Saiba mais';
  detailsBtn.addEventListener('click', () => openDetailsModal(ext));

  const removeBtn = document.createElement('button');
  removeBtn.className = 'card-btn danger';
  removeBtn.textContent = 'Remover';
  removeBtn.addEventListener('click', async () => {
    if (confirm(`Deseja realmente remover a extensão "${ext.name}"?`)) {
      if (window.zeosExtensions) {
        await window.zeosExtensions.remove(ext.id);
        showToast(`Extensão "${ext.name}" removida.`);
        loadExtensions();
      }
    }
  });

  const reloadBtn = document.createElement('button');
  reloadBtn.className = 'card-btn icon-only';
  reloadBtn.title = 'Recarregar extensão';
  reloadBtn.textContent = '🔄';
  reloadBtn.addEventListener('click', async () => {
    if (window.zeosExtensions) {
      await window.zeosExtensions.reload(ext.id);
      showToast(`Extensão "${ext.name}" recarregada.`);
      loadExtensions();
    }
  });

  buttonsGroup.append(detailsBtn, removeBtn, reloadBtn);

  // Toggle Switch
  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'card-toggle';
  toggleLabel.title = isEnabled ? 'Desativar extensão' : 'Ativar extensão';

  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.checked = isEnabled;
  toggleInput.addEventListener('change', async () => {
    const nextState = toggleInput.checked;
    if (window.zeosExtensions) {
      await window.zeosExtensions.toggleEnable(ext.id, nextState);
      showToast(`Extensão ${nextState ? 'ativada' : 'desativada'}.`);
      loadExtensions();
    }
  });

  const sliderSpan = document.createElement('span');
  sliderSpan.className = 'card-slider';

  toggleLabel.append(toggleInput, sliderSpan);
  actionsDiv.append(buttonsGroup, toggleLabel);

  card.append(cardTop, metaDiv, actionsDiv);
  return card;
}

function renderShortcuts(extensions) {
  if (!shortcutsContainer) return;
  shortcutsContainer.replaceChildren();

  const extsWithCommands = extensions.filter(e => e.commands && Object.keys(e.commands).length > 0);

  if (extsWithCommands.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-icon">⌨️</div>
      <h3>Nenhum atalho configurado</h3>
      <p>Nenhuma das extensões instaladas possui comandos de teclado registrados no manifesto.</p>
    `;
    shortcutsContainer.appendChild(empty);
    return;
  }

  for (const ext of extsWithCommands) {
    const card = document.createElement('div');
    card.className = 'shortcut-card';

    const header = document.createElement('div');
    header.className = 'shortcut-card-header';

    const title = document.createElement('h3');
    title.textContent = ext.name;
    header.appendChild(title);

    card.appendChild(header);

    for (const [cmdKey, cmdVal] of Object.entries(ext.commands)) {
      const row = document.createElement('div');
      row.className = 'shortcut-command-row';

      const label = document.createElement('span');
      label.textContent = cmdVal.description || (cmdKey === '_execute_action' ? 'Ativar a extensão' : cmdKey);

      const keyBadge = document.createElement('span');
      keyBadge.className = 'shortcut-key-badge';
      keyBadge.textContent = cmdVal.suggested_key?.default || 'Não definido';

      row.append(label, keyBadge);
      card.appendChild(row);
    }

    shortcutsContainer.appendChild(card);
  }
}

function filterExtensions(list) {
  if (!currentFilter) return list;
  const q = currentFilter.toLowerCase().trim();
  return list.filter(ext => {
    const name = (ext.name || '').toLowerCase();
    const id = (ext.id || '').toLowerCase();
    const desc = (ext.description || '').toLowerCase();
    const perms = Array.isArray(ext.permissions) ? ext.permissions.join(' ').toLowerCase() : '';
    return name.includes(q) || id.includes(q) || desc.includes(q) || perms.includes(q);
  });
}

function render() {
  if (!extensionsGrid) return;
  extensionsGrid.replaceChildren();

  const filtered = filterExtensions(allExtensions);

  if (extensionsCount) {
    extensionsCount.textContent = filtered.length;
  }

  if (filtered.length === 0) {
    if (extensionsEmpty) {
      extensionsEmpty.style.display = 'flex';
      if (currentFilter) {
        emptyMessage.textContent = `Nenhuma extensão corresponde a "${currentFilter}".`;
      } else {
        emptyMessage.textContent = 'Carregue uma pasta com manifest.json ou explore a Chrome Web Store para adicionar funcionalidades.';
      }
    }
    return;
  }

  if (extensionsEmpty) extensionsEmpty.style.display = 'none';

  for (const ext of filtered) {
    const card = renderExtensionCard(ext);
    extensionsGrid.appendChild(card);
  }
}

async function loadExtensions() {
  if (!window.zeosExtensions) return;
  try {
    allExtensions = await window.zeosExtensions.getAll();
    render();
    renderShortcuts(allExtensions);
    populatePackSelect(allExtensions);
  } catch (err) {
    console.error('Error loading extensions:', err);
  }
}

function populatePackSelect(extensions) {
  if (!packExtSelect) return;
  packExtSelect.replaceChildren();

  const defOpt = document.createElement('option');
  defOpt.value = '';
  defOpt.textContent = '-- Selecionar pasta externa no Explorer --';
  packExtSelect.appendChild(defOpt);

  for (const ext of extensions) {
    const opt = document.createElement('option');
    opt.value = ext.id;
    opt.textContent = `${ext.name} (${ext.version || '1.0'})`;
    packExtSelect.appendChild(opt);
  }
}

function openDetailsModal(ext) {
  activeSelectedExt = ext;
  if (!detailsModal) return;

  if (modalExtIcon) {
    modalExtIcon.replaceChildren();
    if (ext.icon) {
      const img = document.createElement('img');
      img.src = ext.icon;
      img.alt = ext.name;
      modalExtIcon.appendChild(img);
    } else {
      modalExtIcon.textContent = (ext.name || 'E')[0].toUpperCase();
    }
  }

  if (modalExtName) modalExtName.textContent = ext.name;
  if (modalExtVersion) modalExtVersion.textContent = `v${ext.version || '1.0'}`;
  if (modalExtDesc) modalExtDesc.textContent = ext.description || 'Nenhuma descrição fornecida pelo autor.';
  if (modalExtId) modalExtId.textContent = ext.id;
  if (modalExtManifestVer) modalExtManifestVer.textContent = ext.hasBackground && ext.backgroundType === 'service_worker' ? 'Manifest V3 (Service Worker)' : 'Manifest V2/V3';
  if (modalExtPath) modalExtPath.textContent = ext.path || 'Armazenamento interno';

  if (modalExtPermissions) {
    modalExtPermissions.replaceChildren();
    const perms = Array.isArray(ext.permissions) && ext.permissions.length > 0 ? ext.permissions : ['Nenhuma permissão especial necessária'];
    for (const p of perms) {
      const tag = document.createElement('span');
      tag.className = 'perm-tag';
      tag.textContent = p;
      modalExtPermissions.appendChild(tag);
    }
  }

  if (modalExtHosts) {
    modalExtHosts.replaceChildren();
    const hosts = Array.isArray(ext.hostPermissions) && ext.hostPermissions.length > 0 ? ext.hostPermissions : ['Apenas sob clique ou abas ativas'];
    for (const h of hosts) {
      const tag = document.createElement('span');
      tag.className = 'perm-tag';
      tag.textContent = h;
      modalExtHosts.appendChild(tag);
    }
  }

  if (modalOpenOptionsBtn) {
    modalOpenOptionsBtn.style.display = ext.optionsPage ? 'inline-flex' : 'none';
  }

  detailsModal.style.display = 'flex';
}

function closeDetailsModal() {
  if (detailsModal) detailsModal.style.display = 'none';
  activeSelectedExt = null;
}

// Event Listeners
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    currentFilter = e.target.value;
    if (searchClearBtn) {
      searchClearBtn.style.display = currentFilter ? 'flex' : 'none';
    }
    render();
  });
}

if (searchClearBtn) {
  searchClearBtn.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    currentFilter = '';
    searchClearBtn.style.display = 'none';
    render();
  });
}

if (devModeToggle) {
  devModeToggle.addEventListener('change', async () => {
    const isDev = devModeToggle.checked;
    if (devToolbar) devToolbar.style.display = isDev ? 'block' : 'none';
    if (window.zeosExtensions) {
      await window.zeosExtensions.setDevMode(isDev);
    }
  });
}

if (loadUnpackedBtn) {
  loadUnpackedBtn.addEventListener('click', async () => {
    if (window.zeosExtensions) {
      const loaded = await window.zeosExtensions.loadUnpacked();
      if (loaded) {
        showToast(`Extensão "${loaded.name}" carregada com sucesso!`);
        loadExtensions();
      }
    }
  });
}

if (emptyLoadBtn) {
  emptyLoadBtn.addEventListener('click', async () => {
    if (window.zeosExtensions) {
      const loaded = await window.zeosExtensions.loadUnpacked();
      if (loaded) {
        showToast(`Extensão "${loaded.name}" carregada com sucesso!`);
        loadExtensions();
      }
    }
  });
}

if (reloadAllBtn) {
  reloadAllBtn.addEventListener('click', async () => {
    if (window.zeosExtensions) {
      await window.zeosExtensions.reloadAll();
      showToast('Todas as extensões foram atualizadas!');
      loadExtensions();
    }
  });
}

if (packExtensionBtn) {
  packExtensionBtn.addEventListener('click', () => {
    if (packModal) packModal.style.display = 'flex';
  });
}

if (packModalClose) packModalClose.addEventListener('click', () => { if (packModal) packModal.style.display = 'none'; });
if (packModalCancel) packModalCancel.addEventListener('click', () => { if (packModal) packModal.style.display = 'none'; });

if (packModalConfirm) {
  packModalConfirm.addEventListener('click', async () => {
    const selectedId = packExtSelect?.value;
    if (packModal) packModal.style.display = 'none';
    if (window.zeosExtensions) {
      const res = await window.zeosExtensions.pack(selectedId);
      if (res && res.success) {
        showToast('Extensão compactada com sucesso em .zip!');
      }
    }
  });
}

if (detailsModalClose) detailsModalClose.addEventListener('click', closeDetailsModal);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDetailsModal);

if (modalOpenFolderBtn) {
  modalOpenFolderBtn.addEventListener('click', () => {
    if (activeSelectedExt && window.zeosExtensions) {
      window.zeosExtensions.showInFolder(activeSelectedExt.id);
    }
  });
}

if (modalOpenOptionsBtn) {
  modalOpenOptionsBtn.addEventListener('click', () => {
    if (activeSelectedExt && window.zeosExtensions) {
      window.zeosExtensions.openOptions(activeSelectedExt.id);
      closeDetailsModal();
    }
  });
}

// Sidebar Navigation
if (navMyExtensions && navShortcuts && viewExtensions && viewShortcuts) {
  navMyExtensions.addEventListener('click', () => {
    navMyExtensions.classList.add('active');
    navShortcuts.classList.remove('active');
    viewExtensions.style.display = 'block';
    viewShortcuts.style.display = 'none';
  });

  navShortcuts.addEventListener('click', () => {
    navShortcuts.classList.add('active');
    navMyExtensions.classList.remove('active');
    viewShortcuts.style.display = 'block';
    viewExtensions.style.display = 'none';
  });
}

if (openWebStoreLink) {
  openWebStoreLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.zeosExtensions) {
      window.zeosExtensions.openWebStore();
    }
  });
}

if (emptyStoreBtn) {
  emptyStoreBtn.addEventListener('click', () => {
    if (window.zeosExtensions) {
      window.zeosExtensions.openWebStore();
    }
  });
}

// Keyboard ESC to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDetailsModal();
    if (packModal) packModal.style.display = 'none';
  }
});

// Initialization
if (window.zeosSettings) {
  window.zeosSettings.get().then((s) => {
    if (s && s.appearance) applyThemeColors(s.appearance);
    if (s && typeof s.developerMode === 'boolean') {
      if (devModeToggle) devModeToggle.checked = s.developerMode;
      if (devToolbar) devToolbar.style.display = s.developerMode ? 'block' : 'none';
    }
  });

  window.zeosSettings.onChanged((s) => {
    if (s && s.appearance) applyThemeColors(s.appearance);
    if (s && typeof s.developerMode === 'boolean') {
      if (devModeToggle) devModeToggle.checked = s.developerMode;
      if (devToolbar) devToolbar.style.display = s.developerMode ? 'block' : 'none';
    }
    loadExtensions();
  });
}

loadExtensions();
