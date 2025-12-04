let currentUser = null;
let obrasCadastradas = [];
let locaisCadastrados = [];
let prestadoresCadastrados = [];
let dadosFinanceiros = [];

document.addEventListener('DOMContentLoaded', async () => {
  await verificarAutenticacao();
  await carregarObras();
  await carregarLocais();
  await carregarPrestadores();
  await carregarDadosFinanceiros();
  
  // Configurar data atual no formulário de pagamento
  const dataInput = document.getElementById('pagamentoData');
  const hoje = new Date().toISOString().split('T')[0];
  dataInput.value = hoje;
  dataInput.max = hoje;
  
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
  
  setTimeout(() => {
    configurarSubmenuCadastros();
    configurarSubmenuServicos();
  }, 100);
}

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

async function carregarObras() {
  try {
    const response = await fetch('/api/obras', {
      credentials: 'include',
    });

    if (response.ok) {
      obrasCadastradas = await response.json();
      
      // Preencher filtro de obras
      const obraFilter = document.getElementById('obraFilter');
      if (obraFilter) {
        obrasCadastradas.forEach(obra => {
          const option = document.createElement('option');
          option.value = obra.descricao;
          option.textContent = obra.descricao;
          obraFilter.appendChild(option);
        });
      }
      
      // Preencher select de obras no formulário de pagamento
      const pagamentoObraSelect = document.getElementById('pagamentoObraId');
      if (pagamentoObraSelect) {
        obrasCadastradas.forEach(obra => {
          const option = document.createElement('option');
          option.value = obra.descricao;
          option.textContent = obra.descricao;
          pagamentoObraSelect.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Erro ao carregar obras:', error);
  }
}

async function carregarLocais() {
  try {
    const response = await fetch('/api/locais', {
      credentials: 'include',
    });

    if (response.ok) {
      locaisCadastrados = await response.json();
      
      // Preencher filtro de locais
      const localFilter = document.getElementById('localFilter');
      if (localFilter) {
        locaisCadastrados.forEach(local => {
          const option = document.createElement('option');
          option.value = local.nome;
          option.textContent = local.nome;
          localFilter.appendChild(option);
        });
      }
      
      // Preencher select de locais no formulário de pagamento
      const pagamentoLocalSelect = document.getElementById('pagamentoLocalId');
      if (pagamentoLocalSelect) {
        locaisCadastrados.forEach(local => {
          const option = document.createElement('option');
          option.value = local.nome;
          option.textContent = local.nome;
          pagamentoLocalSelect.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Erro ao carregar locais:', error);
  }
}

async function carregarPrestadores() {
  try {
    const response = await fetch('/api/prestadores', {
      credentials: 'include',
    });

    if (response.ok) {
      prestadoresCadastrados = await response.json();
      const prestadorSelect = document.getElementById('pagamentoPrestador');
      if (prestadorSelect) {
        // A opção "Construtora" já foi adicionada no HTML, então apenas adicionamos os prestadores cadastrados
        prestadoresCadastrados.forEach(prestador => {
          const option = document.createElement('option');
          option.value = prestador.nome;
          option.textContent = prestador.nome;
          prestadorSelect.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Erro ao carregar prestadores:', error);
  }
}

async function carregarDadosFinanceiros() {
  const container = document.getElementById('resumoFinanceiro');
  if (!container) return;

  try {
    container.innerHTML = '<p class="loading">Carregando dados financeiros...</p>';

    const obraId = document.getElementById('obraFilter')?.value || '';
    const localId = document.getElementById('localFilter')?.value || '';
    const dataInicio = document.getElementById('dataInicio')?.value || '';
    const dataFim = document.getElementById('dataFim')?.value || '';

    const params = new URLSearchParams();
    if (obraId) params.append('obraId', obraId);
    if (localId) params.append('localId', localId);
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);

    const response = await fetch(`/api/financeiro?${params.toString()}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    dadosFinanceiros = await response.json();
    
    if (!Array.isArray(dadosFinanceiros) || dadosFinanceiros.length === 0) {
      container.innerHTML = '<p class="empty">Nenhum dado financeiro encontrado com os filtros aplicados.</p>';
      return;
    }

    renderizarResumoFinanceiro(dadosFinanceiros);
  } catch (error) {
    console.error('Erro ao carregar dados financeiros:', error);
    container.innerHTML = `
      <p class="empty" style="color: var(--ios-red); padding: 20px; text-align: center;">
        <strong>Erro ao carregar dados financeiros</strong><br>
        <span style="font-size: 13px; color: var(--ios-text-secondary);">${error.message || 'Erro desconhecido'}</span>
      </p>
    `;
  }
}

function renderizarResumoFinanceiro(dados) {
  const container = document.getElementById('resumoFinanceiro');
  
    // Agrupar por obra e local
    const obrasMap = {};
    
    dados.forEach(item => {
      const obra = item.obra || 'Sem obra';
      const local = item.local || 'Sem local';
      const chave = `${obra}|||${local}`;
      
      if (!obrasMap[chave]) {
        obrasMap[chave] = {
          obra: obra,
          local: local,
          valorPrevisto: 0,
          compras: [],
          pagamentos: [],
          totalCompras: 0,
          totalPagamentos: 0
        };
      }
    
      if (item.tipo === 'Compra') {
        obrasMap[chave].compras.push(item);
        obrasMap[chave].totalCompras += parseFloat(item.valor || 0);
      } else if (item.tipo === 'Pagamento') {
        obrasMap[chave].pagamentos.push(item);
        obrasMap[chave].totalPagamentos += parseFloat(item.valor || 0);
      }
    });
    
    // Buscar valor previsto de cada obra
    obrasCadastradas.forEach(obra => {
      Object.keys(obrasMap).forEach(chave => {
        if (obrasMap[chave].obra === obra.descricao) {
          obrasMap[chave].valorPrevisto = parseFloat(obra.valorPrevisto || 0);
        }
      });
    });
  
  // Renderizar
  container.innerHTML = Object.values(obrasMap).map(obraData => {
    const saldo = obraData.valorPrevisto - obraData.totalCompras - obraData.totalPagamentos;
    const saldoClass = saldo >= 0 ? 'var(--ios-green)' : 'var(--ios-red)';
    
    return `
      <div class="obra-resumo-card">
        <div class="obra-resumo-header">
          <div class="obra-resumo-title">
            <h3>
              <i data-lucide="building-2" class="info-icon"></i>
              ${obraData.obra}
            </h3>
            ${obraData.local ? `
              <p class="obra-resumo-local">
                <i data-lucide="map-pin" class="info-icon"></i>
                ${obraData.local}
              </p>
            ` : ''}
          </div>
          <button type="button" class="btn-toggle-resumo" onclick="toggleResumoObra('${(obraData.obra + '|||' + obraData.local).replace(/'/g, "\\'")}')" aria-label="Expandir/Recolher">
            <i data-lucide="chevron-down" class="chevron-icon"></i>
          </button>
        </div>
        <div class="obra-resumo-totais">
          <div class="total-item">
            <span class="total-label">Valor Previsto:</span>
            <span class="total-value">R$ ${obraData.valorPrevisto.toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="total-item">
            <span class="total-label">Total Compras:</span>
            <span class="total-value" style="color: var(--ios-orange);">R$ ${obraData.totalCompras.toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="total-item">
            <span class="total-label">Total Pagamentos:</span>
            <span class="total-value" style="color: var(--ios-blue);">R$ ${obraData.totalPagamentos.toFixed(2).replace('.', ',')}</span>
          </div>
          <div class="total-item total-saldo">
            <span class="total-label">Saldo:</span>
            <span class="total-value" style="color: ${saldoClass}; font-weight: 600;">R$ ${saldo.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        <div class="obra-resumo-detalhes" id="detalhes-${(obraData.obra + '|||' + obraData.local).replace(/[^a-zA-Z0-9|||]/g, '_')}" style="display: none;">
          ${obraData.compras.length > 0 ? `
            <div class="detalhes-section">
              <h4>
                <i data-lucide="shopping-cart" class="info-icon"></i>
                Compras Realizadas (${obraData.compras.length})
              </h4>
              <div class="detalhes-list">
                ${obraData.compras.map(compra => `
                  <div class="detalhe-item">
                    <div class="detalhe-info">
                      <span class="detalhe-data">${formatarData(compra.data)}</span>
                      <span class="detalhe-descricao">${compra.descricao || 'Sem descrição'}</span>
                      ${compra.comprador ? `
                        <span class="detalhe-comprador">
                          <i data-lucide="user" class="info-icon"></i>
                          Comprador: ${compra.comprador}
                        </span>
                      ` : ''}
                    </div>
                    <span class="detalhe-valor" style="color: var(--ios-orange);">
                      R$ ${parseFloat(compra.valor || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          ${obraData.pagamentos.length > 0 ? `
            <div class="detalhes-section">
              <h4>
                <i data-lucide="dollar-sign" class="info-icon"></i>
                Pagamentos Realizados (${obraData.pagamentos.length})
              </h4>
              <div class="detalhes-list">
                ${obraData.pagamentos.map(pagamento => `
                  <div class="detalhe-item">
                    <div class="detalhe-info">
                      <span class="detalhe-data">${formatarData(pagamento.data)}</span>
                      <span class="detalhe-descricao">${pagamento.descricao || 'Sem descrição'}</span>
                      ${pagamento.prestador ? `
                        <span class="detalhe-comprador">
                          <i data-lucide="user" class="info-icon"></i>
                          Prestador: ${pagamento.prestador}
                        </span>
                      ` : ''}
                    </div>
                    <span class="detalhe-valor" style="color: var(--ios-blue);">
                      R$ ${parseFloat(pagamento.valor || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Reinicializar ícones
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function toggleResumoObra(chave) {
  const detalhesId = `detalhes-${chave.replace(/[^a-zA-Z0-9|||]/g, '_')}`;
  const detalhes = document.getElementById(detalhesId);
  const btn = event.target.closest('.btn-toggle-resumo');
  const chevron = btn.querySelector('.chevron-icon');
  
  if (detalhes.style.display === 'none') {
    detalhes.style.display = 'block';
    chevron.setAttribute('data-lucide', 'chevron-up');
  } else {
    detalhes.style.display = 'none';
    chevron.setAttribute('data-lucide', 'chevron-down');
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function formatarData(data) {
  if (!data) return 'Sem data';
  try {
    const dataObj = new Date(data);
    if (isNaN(dataObj.getTime())) return data.toString();
    return dataObj.toLocaleDateString('pt-BR');
  } catch {
    return data.toString();
  }
}

function aplicarFiltros() {
  carregarDadosFinanceiros();
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

// Submeter formulário de pagamento
document.getElementById('pagamentoForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('.btn-submit');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="loader-2" class="spinning"></i><span>Registrando...</span>';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  try {
    const formData = {
      obraId: document.getElementById('pagamentoObraId').value,
      localId: document.getElementById('pagamentoLocalId').value,
      data: document.getElementById('pagamentoData').value,
      prestadorId: document.getElementById('pagamentoPrestador').value,
      valor: parseFloat(document.getElementById('pagamentoValor').value),
      descricao: document.getElementById('pagamentoDescricao').value.trim(),
    };

    const response = await fetch('/api/financeiro/pagamento', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem(result.message || 'Pagamento registrado com sucesso!', 'success');
      e.target.reset();
      const dataInput = document.getElementById('pagamentoData');
      const hoje = new Date().toISOString().split('T')[0];
      dataInput.value = hoje;
      await carregarDadosFinanceiros();
    } else {
      mostrarMensagem(result.error || 'Erro ao registrar pagamento', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao registrar pagamento: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="save"></i><span>Registrar Pagamento</span>';
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
});

function mostrarMensagem(texto, tipo) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = texto;
  messageDiv.className = `message ${tipo}`;
  messageDiv.style.display = 'block';

  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 5000);
}

