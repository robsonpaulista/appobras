let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  await verificarAutenticacao();
  await carregarLocais();
  
  document.getElementById('localForm').addEventListener('submit', criarLocal);
  document.getElementById('editLocalForm').addEventListener('submit', atualizarLocal);
  
  // Configurar sidebar
  configurarSidebar();
  
  // Configurar logout (sidebar)
  const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', fazerLogout);
  }
  
  // Inicializar ícones
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

// Configurar sidebar
function configurarSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const menuToggle = document.getElementById('menuToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  
  if (!sidebar) return;
  
  // Carregar estado salvo do localStorage
  const savedState = localStorage.getItem('sidebarState');
  if (savedState === 'collapsed') {
    sidebar.classList.remove('expanded');
    sidebar.classList.add('collapsed');
  }
  
  // Toggle sidebar (desktop) - agora no logo
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('expanded');
      sidebar.classList.toggle('collapsed');
      
      // Salvar estado
      const isCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('sidebarState', isCollapsed ? 'collapsed' : 'expanded');
    });
    
    // Permitir ativação com Enter
    sidebarToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sidebarToggle.click();
      }
    });
  }
  
  // Toggle sidebar (mobile)
  if (menuToggle && sidebarOverlay) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      sidebarOverlay.classList.toggle('active');
      
      // Atualizar ícone
      const icon = menuToggle.querySelector('[data-lucide]');
      if (sidebar.classList.contains('mobile-open')) {
        icon.setAttribute('data-lucide', 'x');
      } else {
        icon.setAttribute('data-lucide', 'menu');
      }
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });
    
    // Fechar sidebar ao clicar no overlay
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      sidebarOverlay.classList.remove('active');
      
      const icon = menuToggle.querySelector('[data-lucide]');
      icon.setAttribute('data-lucide', 'menu');
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });
  }
  
  // Atualizar nome do usuário na sidebar
  atualizarNomeUsuarioSidebar();
  
  // Configurar submenus
  setTimeout(() => {
    configurarSubmenuCadastros();
    configurarSubmenuServicos();
  }, 100);
}

// Configurar submenu de Serviços
function configurarSubmenuServicos() {
  const servicosToggle = document.getElementById('servicosToggle');
  const servicosSubmenu = document.getElementById('servicosSubmenu');
  
  if (!servicosToggle || !servicosSubmenu) return;
  
  const activeSubitem = servicosSubmenu.querySelector('.sidebar-nav-subitem.active');
  let shouldBeExpanded = activeSubitem ? true : (localStorage.getItem('servicosSubmenuExpanded') === 'true');
  
  if (shouldBeExpanded) {
    servicosToggle.setAttribute('aria-expanded', 'true');
    servicosSubmenu.classList.add('show');
    servicosSubmenu.style.display = 'flex';
  }
  
  const newToggle = servicosToggle.cloneNode(true);
  servicosToggle.parentNode.replaceChild(newToggle, servicosToggle);
  
  const toggle = document.getElementById('servicosToggle');
  toggle.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    const menu = document.getElementById('servicosSubmenu');
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    const newState = !isExpanded;
    toggle.setAttribute('aria-expanded', newState);
    if (newState) {
      menu.classList.add('show');
      menu.style.display = 'flex';
    } else {
      menu.classList.remove('show');
      menu.style.display = 'none';
    }
    localStorage.setItem('servicosSubmenuExpanded', newState);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
}

// Configurar submenu de Cadastros
function configurarSubmenuCadastros() {
  const cadastrosToggle = document.getElementById('cadastrosToggle');
  const cadastrosSubmenu = document.getElementById('cadastrosSubmenu');
  
  if (!cadastrosToggle || !cadastrosSubmenu) return;
  
  const activeSubitem = cadastrosSubmenu.querySelector('.sidebar-nav-subitem.active');
  let shouldBeExpanded = activeSubitem ? true : (localStorage.getItem('cadastrosSubmenuExpanded') === 'true');
  
  if (shouldBeExpanded) {
    cadastrosToggle.setAttribute('aria-expanded', 'true');
    cadastrosSubmenu.classList.add('show');
    cadastrosSubmenu.style.display = 'flex';
  }
  
  const newToggle = cadastrosToggle.cloneNode(true);
  cadastrosToggle.parentNode.replaceChild(newToggle, cadastrosToggle);
  
  const toggle = document.getElementById('cadastrosToggle');
  toggle.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    const menu = document.getElementById('cadastrosSubmenu');
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    const newState = !isExpanded;
    toggle.setAttribute('aria-expanded', newState);
    if (newState) {
      menu.classList.add('show');
      menu.style.display = 'flex';
    } else {
      menu.classList.remove('show');
      menu.style.display = 'none';
    }
    localStorage.setItem('cadastrosSubmenuExpanded', newState);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
}

// Atualizar nome do usuário na sidebar
function atualizarNomeUsuarioSidebar() {
  const sidebarUserName = document.getElementById('sidebarUserName');
  if (sidebarUserName && currentUser) {
    sidebarUserName.textContent = currentUser.nome || 'Usuário';
  }
}

async function verificarAutenticacao() {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });

    if (!response.ok) {
      window.location.href = '/login.html';
      return;
    }

    currentUser = await response.json();
    atualizarNomeUsuarioSidebar();
  } catch (error) {
    window.location.href = '/login.html';
  }
}

async function carregarLocais() {
  try {
    const response = await fetch('/api/locais', {
      credentials: 'include',
    });

    if (response.ok) {
      const locais = await response.json();
      exibirLocais(locais);
    } else {
      document.getElementById('locaisList').innerHTML = '<p class="error">Erro ao carregar locais</p>';
    }
  } catch (error) {
    console.error('Erro ao carregar locais:', error);
    document.getElementById('locaisList').innerHTML = '<p class="error">Erro ao carregar locais</p>';
  }
}

function exibirLocais(locais) {
  const container = document.getElementById('locaisList');
  
  if (locais.length === 0) {
    container.innerHTML = '<p class="empty">Nenhum local cadastrado ainda.</p>';
    return;
  }

  container.innerHTML = locais.map(local => `
    <div class="compra-item">
      <div class="compra-info">
        <div class="compra-header-info">
          <h3>${local.nome || 'Sem nome'}</h3>
        </div>
        <div class="compra-details">
          ${local.descricao ? `
            <div class="compra-detail-row compra-descricao-row">
              <span class="compra-label">
                <i data-lucide="file-text" class="info-icon"></i>
                Descrição:
              </span>
              <span class="compra-value compra-descricao">${local.descricao}</span>
            </div>
          ` : ''}
          <div class="compra-detail-row">
            <span class="compra-label">
              <i data-lucide="calendar" class="info-icon"></i>
              Criado em:
            </span>
            <span class="compra-value">${local.dataCriacao ? new Date(local.dataCriacao).toLocaleDateString('pt-BR') : '-'}</span>
          </div>
        </div>
      </div>
      <div class="compra-actions">
        <button type="button" class="btn-edit" onclick="editarLocal('${local.id}')" aria-label="Editar local" title="Editar">
          <i data-lucide="edit-2"></i>
        </button>
        <button type="button" class="btn-remove" onclick="deletarLocal('${local.id}')" aria-label="Deletar local" title="Excluir">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </div>
  `).join('');

  // Inicializar ícones
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

async function criarLocal(e) {
  e.preventDefault();

  const nomeField = document.getElementById('nomeLocal');
  if (!nomeField) {
    console.error('Campo nomeLocal não encontrado');
    mostrarMensagem('Erro: Campo não encontrado', 'error');
    return;
  }

  const nome = nomeField.value.trim();
  const descricao = document.getElementById('descricaoLocal')?.value.trim() || '';
  const submitBtn = e.target.querySelector('.btn-submit');

  if (!nome) {
    mostrarMensagem('Nome do local é obrigatório', 'error');
    nomeField.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="loader-2"></i><span>Criando...</span>';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  try {
    const response = await fetch('/api/locais', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ nome, descricao }),
    });

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem('Local criado com sucesso!', 'success');
      document.getElementById('localForm').reset();
      await carregarLocais();
    } else {
      mostrarMensagem(result.error || 'Erro ao criar local', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao criar local: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="plus"></i><span>Criar Local</span>';
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Editar local
async function editarLocal(id) {
  try {
    // Buscar dados do local
    const response = await fetch('/api/locais', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar locais');
    }

    const locais = await response.json();
    const local = locais.find(l => l.id === id);

    if (!local) {
      mostrarMensagem('Local não encontrado', 'error');
      return;
    }

    // Preencher formulário de edição
    document.getElementById('editLocalId').value = local.id;
    document.getElementById('editNomeLocal').value = local.nome || '';
    document.getElementById('editDescricaoLocal').value = local.descricao || '';

    // Abrir modal
    document.getElementById('editModal').style.display = 'flex';
    
    // Reinicializar ícones
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (error) {
    console.error('Erro ao carregar local para edição:', error);
    mostrarMensagem('Erro ao carregar local: ' + error.message, 'error');
  }
}

// Fechar modal de edição
function fecharModalEdicao() {
  document.getElementById('editModal').style.display = 'none';
  document.getElementById('editLocalForm').reset();
}

// Atualizar local
async function atualizarLocal(e) {
  e.preventDefault();

  const id = document.getElementById('editLocalId').value;
  const nome = document.getElementById('editNomeLocal').value.trim();
  const descricao = document.getElementById('editDescricaoLocal').value.trim() || '';
  const submitBtn = e.target.querySelector('.btn-submit');

  if (!nome) {
    mostrarMensagem('Nome do local é obrigatório', 'error');
    document.getElementById('editNomeLocal').focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="loader-2"></i><span>Salvando...</span>';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  try {
    const response = await fetch(`/api/locais/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ nome, descricao }),
    });

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem('Local atualizado com sucesso!', 'success');
      fecharModalEdicao();
      await carregarLocais();
    } else {
      mostrarMensagem(result.error || 'Erro ao atualizar local', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao atualizar local: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="save"></i><span>Salvar Alterações</span>';
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Deletar local
async function deletarLocal(id) {
  if (!confirm('Tem certeza que deseja excluir este local?')) {
    return;
  }

  try {
    const response = await fetch(`/api/locais/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.ok) {
      mostrarMensagem('Local deletado com sucesso!', 'success');
      await carregarLocais();
    } else {
      const result = await response.json();
      mostrarMensagem(result.error || 'Erro ao deletar local', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao deletar local: ' + error.message, 'error');
  }
}

async function fazerLogout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    window.location.href = '/login.html';
  } catch (error) {
    window.location.href = '/login.html';
  }
}

function mostrarMensagem(texto, tipo) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = texto;
  messageDiv.className = `message ${tipo}`;
  messageDiv.style.display = 'block';

  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 5000);
}

