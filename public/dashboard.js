let currentUser = null;
let obrasCadastradas = [];
let locaisCadastrados = [];
let dadosDashboard = {};

// Variáveis para armazenar os handlers e evitar múltiplos listeners
let servicosToggleHandler = null;
let cadastrosToggleHandler = null;

// Função para inicializar a página
async function inicializarDashboard() {
  await verificarAutenticacao();
  await carregarObras();
  await carregarLocais();
  await carregarDadosDashboard();
  
  // Configurar sidebar (deve ser chamado primeiro)
  configurarSidebar();
  
  // Configurar filtros
  const obraFilter = document.getElementById('obraFilter');
  const localFilter = document.getElementById('localFilter');
  const dataInicio = document.getElementById('dataInicio');
  const dataFim = document.getElementById('dataFim');
  
  if (obraFilter) obraFilter.addEventListener('change', aplicarFiltros);
  if (localFilter) localFilter.addEventListener('change', aplicarFiltros);
  if (dataInicio) dataInicio.addEventListener('change', aplicarFiltros);
  if (dataFim) dataFim.addEventListener('change', aplicarFiltros);
  
  // Configurar logout (sidebar) - após configurar sidebar
  setTimeout(() => {
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    if (sidebarLogoutBtn) {
      sidebarLogoutBtn.addEventListener('click', fazerLogout);
    }
  }, 200);
  
  // Inicializar ícones
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Aguardar DOM estar pronto - funciona tanto no carregamento normal quanto após redirecionamento
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarDashboard);
} else {
  // DOM já está pronto (pode acontecer após redirecionamento)
  // Usar setTimeout para garantir que todos os scripts foram carregados
  setTimeout(inicializarDashboard, 50);
}

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
  
  // Toggle sidebar (desktop)
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('expanded');
      sidebar.classList.toggle('collapsed');
      const isCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('sidebarState', isCollapsed ? 'collapsed' : 'expanded');
    });
    
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
  
  atualizarNomeUsuarioSidebar();
  
  // Configurar submenus com múltiplas tentativas para garantir que funcionem
  // mesmo após redirecionamento do login
  function tentarConfigurarSubmenus(tentativas = 0) {
    const servicosToggle = document.getElementById('servicosToggle');
    const cadastrosToggle = document.getElementById('cadastrosToggle');
    
    if ((servicosToggle && cadastrosToggle) || tentativas >= 5) {
      configurarSubmenuCadastros();
      configurarSubmenuServicos();
    } else {
      // Tentar novamente após um pequeno delay
      setTimeout(() => tentarConfigurarSubmenus(tentativas + 1), 100);
    }
  }
  
  // Tentar imediatamente
  tentarConfigurarSubmenus();
  
  // Também tentar após o window estar completamente carregado
  if (document.readyState === 'loading') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        configurarSubmenuCadastros();
        configurarSubmenuServicos();
      }, 100);
    });
  }
}

function configurarSubmenuServicos() {
  const servicosToggle = document.getElementById('servicosToggle');
  const servicosSubmenu = document.getElementById('servicosSubmenu');
  if (!servicosToggle || !servicosSubmenu) {
    console.error('Elementos do submenu Serviços não encontrados');
    return;
  }
  
  // Remover listener anterior se existir
  if (servicosToggleHandler && servicosToggle) {
    servicosToggle.removeEventListener('click', servicosToggleHandler);
    servicosToggleHandler = null;
  }
  
  // Detectar se algum item do submenu está ativo
  const activeSubitem = servicosSubmenu.querySelector('.sidebar-nav-subitem.active');
  let shouldBeExpanded = false;
  
  // Expandir apenas se houver item ativo ou se estiver salvo no localStorage
  if (activeSubitem) {
    shouldBeExpanded = true;
  } else {
    // Carregar estado salvo
    const savedExpanded = localStorage.getItem('servicosSubmenuExpanded');
    if (savedExpanded === 'true') {
      shouldBeExpanded = true;
    }
  }
  
  // Aplicar estado inicial
  if (shouldBeExpanded) {
    servicosToggle.setAttribute('aria-expanded', 'true');
    servicosSubmenu.classList.add('show');
    servicosSubmenu.style.display = 'flex';
  } else {
    servicosToggle.setAttribute('aria-expanded', 'false');
    servicosSubmenu.classList.remove('show');
    servicosSubmenu.style.display = 'none';
  }
  
  // Criar handler e armazenar
  servicosToggleHandler = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const menu = document.getElementById('servicosSubmenu');
    const toggle = document.getElementById('servicosToggle');
    if (!menu || !toggle) {
      console.error('Elementos do menu Serviços não encontrados');
      return;
    }
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
  };
  
  // Adicionar event listener
  servicosToggle.addEventListener('click', servicosToggleHandler);
}

function configurarSubmenuCadastros() {
  const cadastrosToggle = document.getElementById('cadastrosToggle');
  const cadastrosSubmenu = document.getElementById('cadastrosSubmenu');
  if (!cadastrosToggle || !cadastrosSubmenu) {
    console.error('Elementos do submenu Cadastros não encontrados');
    return;
  }
  
  // Remover listener anterior se existir
  if (cadastrosToggleHandler && cadastrosToggle) {
    cadastrosToggle.removeEventListener('click', cadastrosToggleHandler);
    cadastrosToggleHandler = null;
  }
  
  // Detectar se algum item do submenu está ativo
  const activeSubitem = cadastrosSubmenu.querySelector('.sidebar-nav-subitem.active');
  let shouldBeExpanded = false;
  
  // Expandir apenas se houver item ativo ou se estiver salvo no localStorage
  if (activeSubitem) {
    shouldBeExpanded = true;
  } else {
    // Carregar estado salvo
    const savedExpanded = localStorage.getItem('cadastrosSubmenuExpanded');
    if (savedExpanded === 'true') {
      shouldBeExpanded = true;
    }
  }
  
  // Aplicar estado inicial
  if (shouldBeExpanded) {
    cadastrosToggle.setAttribute('aria-expanded', 'true');
    cadastrosSubmenu.classList.add('show');
    cadastrosSubmenu.style.display = 'flex';
  } else {
    cadastrosToggle.setAttribute('aria-expanded', 'false');
    cadastrosSubmenu.classList.remove('show');
    cadastrosSubmenu.style.display = 'none';
  }
  
  // Criar handler e armazenar
  cadastrosToggleHandler = function(e) {
    e.preventDefault();
    e.stopPropagation();
    const menu = document.getElementById('cadastrosSubmenu');
    const toggle = document.getElementById('cadastrosToggle');
    if (!menu || !toggle) {
      console.error('Elementos do menu Cadastros não encontrados');
      return;
    }
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
  };
  
  // Adicionar event listener
  cadastrosToggle.addEventListener('click', cadastrosToggleHandler);
}

function atualizarNomeUsuarioSidebar() {
  const sidebarUserName = document.getElementById('sidebarUserName');
  if (sidebarUserName && currentUser) {
    sidebarUserName.textContent = currentUser.nome || currentUser.email || 'Usuário';
  }
}

async function verificarAutenticacao() {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });

    if (response.ok) {
      currentUser = await response.json();
      atualizarNomeUsuarioSidebar();
    } else {
      window.location.href = '/login.html';
    }
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    window.location.href = '/login.html';
  }
}

// Carregar obras para preencher o select
async function carregarObras() {
  try {
    const response = await fetch('/api/obras', {
      credentials: 'include',
    });

    if (response.ok) {
      obrasCadastradas = await response.json();
      atualizarSelectObras();
    }
  } catch (error) {
    console.error('Erro ao carregar obras:', error);
  }
}

function atualizarSelectObras() {
  const select = document.getElementById('obraFilter');
  if (!select) return;
  
  // Limpar opções existentes (exceto a primeira "Todas as obras")
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  obrasCadastradas.forEach(obra => {
    const option = document.createElement('option');
    option.value = obra.descricao;
    option.textContent = obra.descricao;
    select.appendChild(option);
  });
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
  const select = document.getElementById('localFilter');
  if (!select) return;
  
  // Limpar opções existentes (exceto a primeira "Todos os locais")
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  locaisCadastrados.forEach(local => {
    const option = document.createElement('option');
    option.value = local.descricao;
    option.textContent = local.descricao;
    select.appendChild(option);
  });
}

async function carregarDadosDashboard() {
  try {
    const obraId = document.getElementById('obraFilter')?.value || '';
    const localId = document.getElementById('localFilter')?.value || '';
    const dataInicio = document.getElementById('dataInicio')?.value || '';
    const dataFim = document.getElementById('dataFim')?.value || '';
    
    const params = new URLSearchParams();
    if (obraId) params.append('obraId', obraId);
    if (localId) params.append('localId', localId);
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    
    const url = `/api/dashboard?${params.toString()}`;
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    dadosDashboard = await response.json();
    renderizarObras();
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
    document.getElementById('obrasDashboard').innerHTML = `
      <p class="empty" style="color: var(--ios-red); padding: 20px; text-align: center;">
        <strong>Erro ao carregar obras</strong><br>
        <span style="font-size: 13px; color: var(--ios-text-secondary);">${error.message || 'Erro desconhecido'}</span>
      </p>
    `;
  }
}

function aplicarFiltros() {
  carregarDadosDashboard();
}

function renderizarObras() {
  const container = document.getElementById('obrasDashboard');
  const obras = dadosDashboard.obras || [];
  
  if (obras.length === 0) {
    container.innerHTML = '<p class="empty">Nenhuma obra cadastrada.</p>';
    return;
  }
  
  container.innerHTML = obras.map(obra => {
    const saldo = obra.valorPrevisto - obra.totalCompras - obra.totalPagamentos;
    const saldoClass = saldo >= 0 ? 'var(--ios-green)' : 'var(--ios-red)';
    const percentualGasto = obra.valorPrevisto > 0 ? ((obra.totalCompras + obra.totalPagamentos) / obra.valorPrevisto * 100) : 0;
    
    return `
      <div class="dashboard-obra-card">
        <div class="dashboard-obra-header">
          <div class="dashboard-obra-title">
            <h3>
              <i data-lucide="building-2" class="info-icon"></i>
              ${obra.descricao || obra.nome || 'Sem nome'}
            </h3>
            ${obra.local ? `
              <p class="dashboard-obra-local">
                <i data-lucide="map-pin" class="info-icon"></i>
                ${obra.local}
              </p>
            ` : ''}
          </div>
          <div class="dashboard-obra-status ${obra.ativo ? 'ativo' : 'inativo'}">
            ${obra.ativo ? 'Ativa' : 'Inativa'}
          </div>
        </div>
        
        <div class="dashboard-obra-stats">
          <div class="dashboard-obra-stat">
            <span class="stat-label-small">Valor Previsto</span>
            <span class="stat-value-small">R$ ${(obra.valorPrevisto || 0).toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="dashboard-obra-stat">
            <span class="stat-label-small">Total Gasto</span>
            <span class="stat-value-small" style="color: var(--ios-orange);">
              R$ ${(obra.totalCompras + obra.totalPagamentos).toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div class="dashboard-obra-stat">
            <span class="stat-label-small">Saldo</span>
            <span class="stat-value-small" style="color: ${saldoClass}; font-weight: 600;">
              R$ ${saldo.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
        
        <div class="dashboard-obra-progress">
          <div class="progress-label">
            <span>Progresso Financeiro</span>
            <span>${percentualGasto.toFixed(1)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(percentualGasto, 100)}%; background: ${percentualGasto > 80 ? 'var(--ios-red)' : percentualGasto > 60 ? 'var(--ios-orange)' : 'var(--ios-green)'};"></div>
          </div>
        </div>
        
        <div class="dashboard-obra-details">
          <div class="dashboard-obra-detail-item">
            <i data-lucide="shopping-cart" class="info-icon"></i>
            <span>${obra.totalCompras || 0} compras</span>
          </div>
          <div class="dashboard-obra-detail-item">
            <i data-lucide="dollar-sign" class="info-icon"></i>
            <span>${obra.totalPagamentos || 0} pagamentos</span>
          </div>
          <div class="dashboard-obra-detail-item">
            <i data-lucide="alert-circle" class="info-icon"></i>
            <span>${obra.pendenciasAbertas || 0} pendências</span>
          </div>
          <div class="dashboard-obra-detail-item">
            <i data-lucide="hard-hat" class="info-icon"></i>
            <span>${obra.totalServicos || 0} serviços</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
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
    console.error('Erro ao fazer logout:', error);
    window.location.href = '/login.html';
  }
}

