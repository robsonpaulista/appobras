let currentUser = null;
let locaisCadastrados = [];

document.addEventListener('DOMContentLoaded', async () => {
  await verificarAutenticacao();
  await carregarLocais();
  await carregarObras();
  
  document.getElementById('obraForm').addEventListener('submit', criarObra);
  document.getElementById('editObraForm').addEventListener('submit', atualizarObra);
  
  // Configurar botões do modal
  const closeEditModal = document.getElementById('closeEditModal');
  const cancelEditModal = document.getElementById('cancelEditModal');
  if (closeEditModal) {
    closeEditModal.addEventListener('click', fecharModalEdicao);
  }
  if (cancelEditModal) {
    cancelEditModal.addEventListener('click', fecharModalEdicao);
  }
  
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

// Carregar locais para preencher o select
async function carregarLocais() {
  try {
    const response = await fetch('/api/locais', {
      credentials: 'include',
    });

    if (response.ok) {
      locaisCadastrados = await response.json();
      atualizarSelectLocais();
    }
  } catch (error) {
    console.error('Erro ao carregar locais:', error);
  }
}

function atualizarSelectLocais() {
  const select = document.getElementById('localObra');
  if (!select) return;
  
  const valorAtual = select.value;
  select.innerHTML = '<option value="">Selecione o local...</option>';
  
  if (locaisCadastrados && locaisCadastrados.length > 0) {
    locaisCadastrados.forEach(local => {
      const option = document.createElement('option');
      option.value = local.nome;
      option.textContent = local.nome;
      select.appendChild(option);
    });
  }
  
  if (valorAtual) {
    select.value = valorAtual;
  }
}

async function carregarObras() {
  try {
    const response = await fetch('/api/obras', {
      credentials: 'include',
    });

    if (response.ok) {
      const obras = await response.json();
      exibirObras(obras);
    } else {
      document.getElementById('obrasList').innerHTML = '<p class="error">Erro ao carregar obras</p>';
    }
  } catch (error) {
    console.error('Erro ao carregar obras:', error);
    document.getElementById('obrasList').innerHTML = '<p class="error">Erro ao carregar obras</p>';
  }
}

function exibirObras(obras) {
  const container = document.getElementById('obrasList');
  
  if (obras.length === 0) {
    container.innerHTML = '<p class="empty">Nenhuma obra cadastrada ainda.</p>';
    return;
  }

  container.innerHTML = obras.map(obra => `
    <div class="compra-item">
      <div class="compra-info">
        <div class="compra-header-info">
          <h3>${obra.descricao || 'Sem descrição'}</h3>
        </div>
        <div class="compra-details">
          ${obra.local ? `
            <div class="compra-detail-row">
              <span class="compra-label">
                <i data-lucide="map-pin" class="info-icon"></i>
                Local:
              </span>
              <span class="compra-value">${obra.local}</span>
            </div>
          ` : ''}
          ${obra.previsaoInicio ? `
            <div class="compra-detail-row">
              <span class="compra-label">
                <i data-lucide="calendar" class="info-icon"></i>
                Previsão de Início:
              </span>
              <span class="compra-value">${formatarData(obra.previsaoInicio)}</span>
            </div>
          ` : ''}
          ${obra.previsaoFim ? `
            <div class="compra-detail-row">
              <span class="compra-label">
                <i data-lucide="calendar" class="info-icon"></i>
                Previsão de Fim:
              </span>
              <span class="compra-value">${formatarData(obra.previsaoFim)}</span>
            </div>
          ` : ''}
          ${obra.valorPrevisto ? `
            <div class="compra-detail-row">
              <span class="compra-label">
                <i data-lucide="dollar-sign" class="info-icon"></i>
                Valor Previsto:
              </span>
              <span class="compra-value">R$ ${formatarMoeda(obra.valorPrevisto)}</span>
            </div>
          ` : ''}
          ${obra.dataCriacao ? `
            <div class="compra-detail-row">
              <span class="compra-label">
                <i data-lucide="clock" class="info-icon"></i>
                Criado em:
              </span>
              <span class="compra-value">${formatarData(obra.dataCriacao)}</span>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="compra-actions">
        <button type="button" class="btn-edit" data-action="edit" data-id="${obra.id}" aria-label="Editar obra" title="Editar">
          <i data-lucide="edit-2"></i>
        </button>
        <button type="button" class="btn-remove" data-action="delete" data-id="${obra.id}" aria-label="Deletar obra" title="Excluir">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </div>
  `).join('');
  
  // Adicionar event listeners usando delegação de eventos
  container.addEventListener('click', (e) => {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    
    const action = button.getAttribute('data-action');
    const id = button.getAttribute('data-id');
    
    if (action === 'edit' && id) {
      editarObra(id);
    } else if (action === 'delete' && id) {
      deletarObra(id);
    }
  });
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function formatarData(data) {
  if (!data) return '';
  try {
    const date = new Date(data);
    if (isNaN(date.getTime())) {
      // Tentar formato YYYY-MM-DD
      const parts = data.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return data;
    }
    return date.toLocaleDateString('pt-BR');
  } catch {
    return data;
  }
}

function formatarMoeda(valor) {
  if (!valor) return '0,00';
  const num = parseFloat(valor);
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function criarObra(e) {
  e.preventDefault();

  const descricaoField = document.getElementById('descricaoObra');
  if (!descricaoField) {
    console.error('Campo descricaoObra não encontrado');
    mostrarMensagem('Erro: Campo não encontrado', 'error');
    return;
  }

  const descricao = descricaoField.value.trim();
  const local = document.getElementById('localObra')?.value.trim() || '';
  const previsaoInicio = document.getElementById('previsaoInicio')?.value || '';
  const previsaoFim = document.getElementById('previsaoFim')?.value || '';
  const valorPrevisto = document.getElementById('valorPrevisto')?.value || '0';
  const submitBtn = e.target.querySelector('.btn-submit');

  console.log('Dados capturados:', { descricao, local, previsaoInicio, previsaoFim, valorPrevisto });

  if (!descricao) {
    mostrarMensagem('Descrição da obra é obrigatória', 'error');
    descricaoField.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="loader-2"></i><span>Criando...</span>';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  try {
    const bodyData = { 
      descricao, 
      local, 
      previsaoInicio, 
      previsaoFim, 
      valorPrevisto 
    };
    
    console.log('Enviando para API:', bodyData);

    const response = await fetch('/api/obras', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(bodyData),
    });

    const result = await response.json();
    console.log('Resposta da API:', result);

    if (response.ok) {
      mostrarMensagem('Obra criada com sucesso!', 'success');
      document.getElementById('obraForm').reset();
      await carregarObras();
    } else {
      console.error('Erro na resposta:', result);
      mostrarMensagem(result.error || 'Erro ao criar obra', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao criar obra: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="plus"></i><span>Criar Obra</span>';
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Editar obra
async function editarObra(id) {
  try {
    // Buscar dados da obra
    const response = await fetch('/api/obras', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar obras');
    }

    const obras = await response.json();
    const obra = obras.find(o => o.id === id);

    if (!obra) {
      mostrarMensagem('Obra não encontrada', 'error');
      return;
    }

    // Preencher formulário de edição
    document.getElementById('editObraId').value = obra.id;
    document.getElementById('editDescricaoObra').value = obra.descricao || '';
    
    // Converter datas para formato YYYY-MM-DD
    let previsaoInicio = '';
    if (obra.previsaoInicio) {
      try {
        const date = new Date(obra.previsaoInicio);
        if (!isNaN(date.getTime())) {
          previsaoInicio = date.toISOString().split('T')[0];
        } else if (obra.previsaoInicio.includes('/')) {
          // Formato DD/MM/YYYY
          const parts = obra.previsaoInicio.split('/');
          if (parts.length === 3) {
            previsaoInicio = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        } else if (obra.previsaoInicio.includes('-')) {
          previsaoInicio = obra.previsaoInicio.split('T')[0];
        }
      } catch (e) {
        console.error('Erro ao converter data de início:', e);
      }
    }
    
    let previsaoFim = '';
    if (obra.previsaoFim) {
      try {
        const date = new Date(obra.previsaoFim);
        if (!isNaN(date.getTime())) {
          previsaoFim = date.toISOString().split('T')[0];
        } else if (obra.previsaoFim.includes('/')) {
          // Formato DD/MM/YYYY
          const parts = obra.previsaoFim.split('/');
          if (parts.length === 3) {
            previsaoFim = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        } else if (obra.previsaoFim.includes('-')) {
          previsaoFim = obra.previsaoFim.split('T')[0];
        }
      } catch (e) {
        console.error('Erro ao converter data de fim:', e);
      }
    }
    
    document.getElementById('editPrevisaoInicio').value = previsaoInicio;
    document.getElementById('editPrevisaoFim').value = previsaoFim;
    document.getElementById('editValorPrevisto').value = obra.valorPrevisto || '0';

    // Preencher select de local
    const editLocalSelect = document.getElementById('editLocalObra');
    editLocalSelect.innerHTML = '<option value="">Selecione o local...</option>';
    locaisCadastrados.forEach(local => {
      const option = document.createElement('option');
      option.value = local.nome;
      option.textContent = local.nome;
      if (local.nome === obra.local) {
        option.selected = true;
      }
      editLocalSelect.appendChild(option);
    });

    // Abrir modal
    document.getElementById('editModal').style.display = 'flex';
    
    // Reinicializar ícones
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (error) {
    console.error('Erro ao carregar obra para edição:', error);
    mostrarMensagem('Erro ao carregar obra: ' + error.message, 'error');
  }
}

// Fechar modal de edição
function fecharModalEdicao() {
  document.getElementById('editModal').style.display = 'none';
  document.getElementById('editObraForm').reset();
}

// Atualizar obra
async function atualizarObra(e) {
  e.preventDefault();

  const id = document.getElementById('editObraId').value;
  const descricao = document.getElementById('editDescricaoObra').value.trim();
  const local = document.getElementById('editLocalObra')?.value.trim() || '';
  const previsaoInicio = document.getElementById('editPrevisaoInicio')?.value || '';
  const previsaoFim = document.getElementById('editPrevisaoFim')?.value || '';
  const valorPrevisto = document.getElementById('editValorPrevisto')?.value || '0';
  const submitBtn = e.target.querySelector('.btn-submit');

  if (!descricao) {
    mostrarMensagem('Descrição da obra é obrigatória', 'error');
    document.getElementById('editDescricaoObra').focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="loader-2"></i><span>Salvando...</span>';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  try {
    const response = await fetch(`/api/obras/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ descricao, local, previsaoInicio, previsaoFim, valorPrevisto }),
    });

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem('Obra atualizada com sucesso!', 'success');
      fecharModalEdicao();
      await carregarObras();
    } else {
      mostrarMensagem(result.error || 'Erro ao atualizar obra', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao atualizar obra: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="save"></i><span>Salvar Alterações</span>';
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Deletar obra
async function deletarObra(id) {
  if (!confirm('Tem certeza que deseja excluir esta obra?')) {
    return;
  }

  try {
    const response = await fetch(`/api/obras/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.ok) {
      mostrarMensagem('Obra deletada com sucesso!', 'success');
      await carregarObras();
    } else {
      const result = await response.json();
      mostrarMensagem(result.error || 'Erro ao deletar obra', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao deletar obra: ' + error.message, 'error');
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

