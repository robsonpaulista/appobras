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
  
  // Configurar toggle dos filtros
  configurarToggleFiltros();
  
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
  
  // Expandir apenas se houver item ativo (não usar localStorage para expandir automaticamente)
  if (activeSubitem) {
    shouldBeExpanded = true;
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

function configurarToggleFiltros() {
  const filtrosToggle = document.getElementById('filtrosToggle');
  const filtrosContent = document.getElementById('filtrosContent');
  
  if (!filtrosToggle || !filtrosContent) {
    return;
  }
  
  // Carregar estado salvo do localStorage
  const savedState = localStorage.getItem('filtrosExpanded');
  const isExpanded = savedState !== 'false'; // Por padrão, expandido
  
  if (!isExpanded) {
    filtrosToggle.setAttribute('aria-expanded', 'false');
    filtrosContent.classList.add('collapsed');
  } else {
    filtrosToggle.setAttribute('aria-expanded', 'true');
    filtrosContent.classList.remove('collapsed');
  }
  
  filtrosToggle.addEventListener('click', () => {
    const isCurrentlyExpanded = filtrosToggle.getAttribute('aria-expanded') === 'true';
    const newState = !isCurrentlyExpanded;
    
    filtrosToggle.setAttribute('aria-expanded', newState);
    
    if (newState) {
      filtrosContent.classList.remove('collapsed');
    } else {
      filtrosContent.classList.add('collapsed');
    }
    
    localStorage.setItem('filtrosExpanded', newState);
  });
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

// Função para formatar valores em R$ com ponto para milhar
function formatarMoeda(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return 'R$ 0,00';
  }
  
  const valorNumero = parseFloat(valor);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valorNumero);
}

function renderizarObras() {
  const container = document.getElementById('obrasDashboard');
  const obras = dadosDashboard.obras || [];
  
  if (obras.length === 0) {
    container.innerHTML = '<p class="empty">Nenhuma obra cadastrada.</p>';
    return;
  }
  
  container.innerHTML = obras.map((obra, index) => {
    const saldo = obra.valorPrevisto - obra.totalCompras - obra.totalPagamentos;
    const saldoClass = saldo >= 0 ? 'var(--ios-green)' : 'var(--ios-red)';
    const percentualGasto = obra.valorPrevisto > 0 ? ((obra.totalCompras + obra.totalPagamentos) / obra.valorPrevisto * 100) : 0;
    const obraId = `obra-${index}`;
    const totalGasto = obra.totalCompras + obra.totalPagamentos;
    
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
            <span class="stat-value-small">${formatarMoeda(obra.valorPrevisto)}</span>
          </div>
          <div class="dashboard-obra-stat">
            <span class="stat-label-small">Total Gasto</span>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="stat-value-small" style="color: var(--ios-orange);">
                ${formatarMoeda(totalGasto)}
              </span>
              ${totalGasto > 0 ? `
                <button type="button" class="btn-expand-gastos" onclick="toggleDetalhesGastos('${obraId}')" aria-label="Expandir detalhes dos gastos">
                  <i data-lucide="chevron-down" class="expand-icon" id="icon-${obraId}"></i>
                </button>
              ` : ''}
            </div>
          </div>
          <div class="dashboard-obra-stat">
            <span class="stat-label-small">Saldo</span>
            <span class="stat-value-small" style="color: ${saldoClass}; font-weight: 600;">
              ${formatarMoeda(saldo)}
            </span>
          </div>
        </div>
        
        <div class="dashboard-gastos-detalhes" id="detalhes-${obraId}" style="display: none;">
          ${obra.compras && obra.compras.length > 0 ? `
            <div class="gastos-categoria">
              <h4 class="gastos-categoria-title">
                <i data-lucide="shopping-cart" class="info-icon"></i>
                Compras (${obra.compras.length})
                <span class="gastos-total">${formatarMoeda(obra.totalCompras)}</span>
              </h4>
              <div class="gastos-lista">
                ${obra.compras.map(compra => `
                  <div class="gasto-item">
                    <div class="gasto-item-info">
                      <span class="gasto-descricao">${compra.descricao || 'Sem descrição'}</span>
                      ${compra.local ? `<span class="gasto-local">${compra.local}</span>` : ''}
                      ${compra.data ? `<span class="gasto-data">${formatarData(compra.data)}</span>` : ''}
                    </div>
                    <span class="gasto-valor">${formatarMoeda(compra.valor)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          ${obra.pagamentos && obra.pagamentos.length > 0 ? `
            <div class="gastos-categoria">
              <h4 class="gastos-categoria-title">
                <i data-lucide="dollar-sign" class="info-icon"></i>
                Pagamentos (${obra.pagamentos.length})
                <span class="gastos-total">${formatarMoeda(obra.totalPagamentos)}</span>
              </h4>
              <div class="gastos-lista">
                ${obra.pagamentos.map(pagamento => `
                  <div class="gasto-item">
                    <div class="gasto-item-info">
                      <span class="gasto-descricao">${pagamento.descricao || 'Sem descrição'}</span>
                      ${pagamento.prestador ? `<span class="gasto-prestador">${pagamento.prestador}</span>` : ''}
                      ${pagamento.local ? `<span class="gasto-local">${pagamento.local}</span>` : ''}
                      ${pagamento.data ? `<span class="gasto-data">${formatarData(pagamento.data)}</span>` : ''}
                    </div>
                    <span class="gasto-valor">${formatarMoeda(pagamento.valor)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="dashboard-obra-progress">
          <div class="progress-label">
            <span>Progresso Financeiro</span>
            <span>${percentualGasto.toFixed(1)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(percentualGasto, 100)}%; background: var(--primary-gradient);"></div>
          </div>
        </div>
        
        <div class="dashboard-obra-details">
          <div class="dashboard-obra-detail-item">
            <i data-lucide="shopping-cart" class="info-icon"></i>
            <span>${obra.compras?.length || 0} compras</span>
          </div>
          <div class="dashboard-obra-detail-item">
            <i data-lucide="dollar-sign" class="info-icon"></i>
            <span>${obra.pagamentos?.length || 0} pagamentos</span>
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

function toggleDetalhesGastos(obraId) {
  const detalhes = document.getElementById(`detalhes-${obraId}`);
  const icon = document.getElementById(`icon-${obraId}`);
  
  if (!detalhes || !icon) return;
  
  const isExpanded = detalhes.style.display !== 'none';
  
  if (isExpanded) {
    detalhes.style.display = 'none';
    icon.setAttribute('data-lucide', 'chevron-down');
  } else {
    detalhes.style.display = 'block';
    icon.setAttribute('data-lucide', 'chevron-up');
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function formatarData(dataStr) {
  if (!dataStr) return '';
  
  try {
    // Se já está no formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
      const [ano, mes, dia] = dataStr.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    
    // Tentar parse direto
    const data = new Date(dataStr);
    if (!isNaN(data.getTime())) {
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
    
    return dataStr;
  } catch {
    return dataStr;
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

