// Variáveis globais
let locaisCadastrados = [];
let obrasCadastradas = [];
let prestadoresCadastrados = [];
let currentUser = null;
let watchId = null; // Para GPS

// Formatar data para pendências
function formatarDataPendencia(data) {
  if (!data) return 'Sem data';
  try {
    const dataObj = new Date(data);
    if (isNaN(dataObj.getTime())) return data;
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = dataObj.getFullYear();
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const diaSemana = diasSemana[dataObj.getDay()];
    return `${diaSemana}, ${dia}/${mes}/${ano}`;
  } catch {
    return data;
  }
}

// Carregar pendências registradas
async function carregarPendenciasRegistradas() {
  const container = document.getElementById('pendenciasRegistradas');
  if (!container) {
    return;
  }

  const obraId = document.getElementById('obraId')?.value || '';
  const localId = document.getElementById('localId')?.value || '';
  const data = document.getElementById('data')?.value || '';

  // Não carregar se não tiver obra e local selecionados
  if (!obraId || !localId) {
    container.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--ios-text-secondary);">Selecione uma obra e um local para ver as pendências registradas.</p>';
    return;
  }

  try {
    container.innerHTML = '<p class="loading" style="text-align: center; padding: 20px; color: var(--ios-text-secondary);">Carregando pendências...</p>';

    const params = new URLSearchParams();
    if (obraId) params.append('obraId', obraId);
    if (localId) params.append('localId', localId);
    if (data) params.append('data', data);

    const url = `/api/diario/pendencias-registradas?${params.toString()}`;

    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro na resposta:', response.status, errorData);
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }

    const pendencias = await response.json();

    if (!Array.isArray(pendencias)) {
      console.error('Resposta inválida da API:', pendencias);
      container.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--ios-red);">Erro: Formato de resposta inválido.</p>';
      return;
    }

    if (pendencias.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--ios-text-secondary);">Nenhuma pendência registrada para esta obra/local.</p>';
      return;
    }

    // Agrupar por data
    const pendenciasPorData = {};
    pendencias.forEach(pendencia => {
      const dataPendencia = pendencia.data || 'Sem data';
      if (!pendenciasPorData[dataPendencia]) {
        pendenciasPorData[dataPendencia] = [];
      }
      pendenciasPorData[dataPendencia].push(pendencia);
    });

    const datasOrdenadas = Object.keys(pendenciasPorData).sort((a, b) => {
      const dataA = new Date(a);
      const dataB = new Date(b);
      return dataB - dataA;
    });

    let html = '';
    datasOrdenadas.forEach(dataPendencia => {
      const pendenciasDoDia = pendenciasPorData[dataPendencia];
      const dataFormatada = formatarDataPendencia(dataPendencia);
      
      html += `
        <div class="ios-grouped-container" style="margin-bottom: 16px;">
          <div style="padding: 12px 16px; border-bottom: 0.5px solid var(--ios-separator); background: var(--ios-bg-secondary);">
            <h4 style="margin: 0; font-size: 15px; font-weight: 600; color: var(--ios-text-primary);">
              <i data-lucide="calendar" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;"></i>
              ${dataFormatada}
            </h4>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--ios-text-secondary);">
              ${pendenciasDoDia.length} ${pendenciasDoDia.length === 1 ? 'pendência' : 'pendências'}
            </p>
          </div>
      `;

      pendenciasDoDia.forEach((pendencia, index) => {
        const prioridadeClass = pendencia.prioridade === 'Alta' ? 'var(--ios-red)' : 
                                pendencia.prioridade === 'Média' ? 'var(--ios-orange)' : 
                                'var(--ios-text-secondary)';
        
        html += `
          <div class="local-item" style="border-radius: 0; ${index === pendenciasDoDia.length - 1 ? 'border-bottom: none;' : ''}">
            <div class="local-info" style="flex: 1;">
              <h3 style="margin-bottom: 8px; color: var(--ios-text-primary); font-size: 17px; font-weight: 600;">
                ${pendencia.descricao || 'Sem descrição'}
              </h3>
              <p style="margin-bottom: 4px; color: var(--ios-text-secondary); font-size: 15px;">
                <strong>Prioridade:</strong> 
                <span style="color: ${prioridadeClass}; font-weight: 500;">${pendencia.prioridade}</span>
              </p>
              <p style="margin-bottom: 4px; color: var(--ios-text-secondary); font-size: 15px;">
                <strong>Status:</strong> ${pendencia.status || 'Pendente'}
              </p>
              ${pendencia.responsavel ? `
                <p style="margin-bottom: 0; color: var(--ios-text-secondary); font-size: 15px;">
                  <strong>Responsável:</strong> ${pendencia.responsavel}
                </p>
              ` : ''}
            </div>
          </div>
        `;
      });

      html += '</div>';
    });

    container.innerHTML = html;

    // Reinicializar ícones
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (error) {
    console.error('Erro ao carregar pendências:', error);
    container.innerHTML = `<p style="text-align: center; padding: 20px; color: var(--ios-red);">Erro ao carregar pendências registradas: ${error.message}</p>`;
  }
}

// Verificar autenticação e carregar dados
document.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticação
  await verificarAutenticacao();
  
  // Carregar obras, locais e prestadores
  await carregarObras();
  await carregarLocais();
  await carregarPrestadores();
  
  // Garantir que os selects sejam atualizados
  atualizarSelectsObras();
  atualizarSelectsLocais();
  atualizarSelectsPrestadores();
  
  // Configurar data atual
  const dataInput = document.getElementById('data');
  const hoje = new Date().toISOString().split('T')[0];
  dataInput.value = hoje;
  dataInput.max = hoje;
  
  // Carregar pendências registradas quando obra/local/data mudarem
  const obraSelect = document.getElementById('obraId');
  const localSelect = document.getElementById('localId');
  
  if (obraSelect) {
    obraSelect.addEventListener('change', () => {
      carregarPendenciasRegistradas();
    });
  }
  if (localSelect) {
    localSelect.addEventListener('change', () => {
      carregarPendenciasRegistradas();
    });
  }
  if (dataInput) {
    dataInput.addEventListener('change', () => {
      carregarPendenciasRegistradas();
    });
  }
  
  // Carregar pendências iniciais após um delay para garantir que os selects estejam populados
  setTimeout(() => {
    carregarPendenciasRegistradas();
  }, 1500);

  // Validar horário (até 18h)
  const horaAtual = new Date().getHours();
  if (horaAtual >= 18) {
    mostrarMensagem('Atenção: O registro deve ser feito até 18h. O horário atual já passou do limite.', 'error');
  }

  // Configurar sidebar
  configurarSidebar();
  
  // Configurar logout (sidebar)
  const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', fazerLogout);
  }
  
  // Iniciar monitoramento de GPS
  iniciarGPS();
  
  // Inicializar ícones Lucide
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
  
  // Configurar submenu de Cadastros
  setTimeout(() => {
    configurarSubmenuCadastros();
    configurarSubmenuServicos();
  }, 100);
}

// Configurar submenu de Serviços
function configurarSubmenuServicos() {
  const servicosToggle = document.getElementById('servicosToggle');
  const servicosSubmenu = document.getElementById('servicosSubmenu');
  
  if (!servicosToggle || !servicosSubmenu) {
    console.error('Elementos do submenu Serviços não encontrados');
    return;
  }
  
  // Verificar se estamos na página principal (Diário de Obra)
  const isDiarioPage = window.location.pathname === '/' || window.location.pathname === '/index.html';
  
  // Detectar se algum item do submenu está ativo
  const activeSubitem = servicosSubmenu.querySelector('.sidebar-nav-subitem.active');
  let shouldBeExpanded = false;
  
  if (activeSubitem || isDiarioPage) {
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
  
  // Remover event listeners anteriores
  const newToggle = servicosToggle.cloneNode(true);
  servicosToggle.parentNode.replaceChild(newToggle, servicosToggle);
  
  // Toggle ao clicar
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
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  });
}

// Configurar submenu de Cadastros
function configurarSubmenuCadastros() {
  const cadastrosToggle = document.getElementById('cadastrosToggle');
  const cadastrosSubmenu = document.getElementById('cadastrosSubmenu');
  
  if (!cadastrosToggle) {
    console.error('cadastrosToggle não encontrado');
    return;
  }
  
  if (!cadastrosSubmenu) {
    console.error('cadastrosSubmenu não encontrado');
    return;
  }
  
  // Detectar se algum item do submenu está ativo
  const activeSubitem = cadastrosSubmenu.querySelector('.sidebar-nav-subitem.active');
  let shouldBeExpanded = false;
  
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
  
  // Remover event listeners anteriores (se houver)
  const newToggle = cadastrosToggle.cloneNode(true);
  cadastrosToggle.parentNode.replaceChild(newToggle, cadastrosToggle);
  
  // Toggle ao clicar
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
    
    // Salvar estado
    localStorage.setItem('cadastrosSubmenuExpanded', newState);
    
    // Atualizar ícone chevron
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  });
}

// Atualizar nome do usuário na sidebar
function atualizarNomeUsuarioSidebar() {
  const sidebarUserName = document.getElementById('sidebarUserName');
  if (sidebarUserName && currentUser) {
    sidebarUserName.textContent = currentUser.nome || 'Usuário';
  }
}

// Verificar autenticação
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
    // Erro de rede ou servidor - redirecionar para login silenciosamente
    window.location.href = '/login.html';
  }
}

// Carregar obras
async function carregarObras() {
  try {
    const response = await fetch('/api/obras', {
      credentials: 'include',
    });

    if (response.ok) {
      obrasCadastradas = await response.json();
    }
  } catch (error) {
    console.error('Erro ao carregar obras:', error);
  }
}

// Carregar locais
async function carregarLocais() {
  try {
    const response = await fetch('/api/locais', {
      credentials: 'include',
    });

    if (response.ok) {
      locaisCadastrados = await response.json();
      atualizarSelectsLocais();
    }
  } catch (error) {
    console.error('Erro ao carregar locais:', error);
  }
}

// Carregar prestadores
async function carregarPrestadores() {
  try {
    const response = await fetch('/api/prestadores', {
      credentials: 'include',
    });

    if (response.ok) {
      prestadoresCadastrados = await response.json();
    }
  } catch (error) {
    console.error('Erro ao carregar prestadores:', error);
  }
}

// Atualizar select de obras
function atualizarSelectsObras() {
  const obraSelectHeader = document.getElementById('obraId');
  if (obraSelectHeader) {
    const valorAtual = obraSelectHeader.value;
    obraSelectHeader.innerHTML = '<option value="">Selecione a obra...</option>';
    
    if (obrasCadastradas && obrasCadastradas.length > 0) {
      obrasCadastradas.forEach(obra => {
        const option = document.createElement('option');
        option.value = obra.descricao;
        option.textContent = obra.descricao;
        obraSelectHeader.appendChild(option);
      });
    }
    
    if (valorAtual) {
      obraSelectHeader.value = valorAtual;
    }
  }
}

// Atualizar todos os selects de locais
function atualizarSelectsLocais() {
  // Atualizar o select principal de local no header
  const localSelectHeader = document.getElementById('localId');
  if (localSelectHeader) {
    atualizarSelectLocal(localSelectHeader);
  }
  
  
}

// Atualizar todos os selects de prestadores
function atualizarSelectsPrestadores() {
  const prestadorSelects = document.querySelectorAll('select[data-field="prestadorId"]');
  prestadorSelects.forEach(select => {
    atualizarSelectPrestador(select);
  });
}

// Atualizar um select de prestador específico
function atualizarSelectPrestador(selectElement) {
  const valorAtual = selectElement.value;
  const nomeAtual = selectElement.closest('.profissional-row')?.querySelector('[data-field="nome"]')?.value || '';
  
  selectElement.innerHTML = '<option value="">Selecione o prestador...</option>';
  
  if (prestadoresCadastrados && prestadoresCadastrados.length > 0) {
    prestadoresCadastrados.forEach(prestador => {
      const option = document.createElement('option');
      option.value = prestador.id;
      option.textContent = `${prestador.nome} - ${prestador.funcao || ''}`;
      option.setAttribute('data-nome', prestador.nome);
      option.setAttribute('data-funcao', prestador.funcao || '');
      option.setAttribute('data-valor-diaria', prestador.valorDiaria || '0');
      selectElement.appendChild(option);
    });
  }
  
  // Restaurar valor selecionado se existir
  if (valorAtual) {
    selectElement.value = valorAtual;
  } else if (nomeAtual) {
    // Tentar encontrar pelo nome se não tiver ID
    const option = Array.from(selectElement.options).find(opt => 
      opt.getAttribute('data-nome') === nomeAtual
    );
    if (option) {
      selectElement.value = option.value;
    }
  }
}

// Função chamada quando um prestador é selecionado
function selecionarPrestador(selectElement) {
  const row = selectElement.closest('.profissional-row');
  if (!row) return;
  
  const nomeInput = row.querySelector('[data-field="nome"]');
  const funcaoInput = row.querySelector('[data-field="funcao"]');
  const valorInput = row.querySelector('[data-field="valorMaoObra"]');
  
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  
  if (selectedOption.value) {
    const nome = selectedOption.getAttribute('data-nome') || '';
    const funcao = selectedOption.getAttribute('data-funcao') || '';
    const valorDiaria = selectedOption.getAttribute('data-valor-diaria') || '0';
    
    if (nomeInput) nomeInput.value = nome;
    if (funcaoInput) funcaoInput.value = funcao;
    if (valorInput) valorInput.value = parseFloat(valorDiaria).toFixed(2);
  } else {
    // Limpar campos se nenhum prestador estiver selecionado
    if (nomeInput) nomeInput.value = '';
    if (funcaoInput) funcaoInput.value = '';
    if (valorInput) valorInput.value = '';
  }
}

// Fazer logout
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

// Iniciar GPS automático
function iniciarGPS() {
  if (!navigator.geolocation) {
    console.warn('Geolocalização não é suportada');
    return;
  }

  // Obter posição inicial
  navigator.geolocation.getCurrentPosition(
    () => {},
    () => {}
  );

  // Monitorar mudanças de posição (opcional, para atualizar se o usuário se mover)
  watchId = navigator.geolocation.watchPosition(
    () => {},
    () => {},
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    }
  );
}

// Obter GPS atual para uma foto
async function obterGPSAtual() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

// Adicionar Profissional dentro de um Serviço
function adicionarProfissionalServico(btn) {
  const profissionaisList = btn.previousElementSibling;
  const novoRow = document.createElement('div');
  novoRow.className = 'profissional-row';
  novoRow.innerHTML = `
    <select 
      class="input-field input-small" 
      data-field="prestadorId"
      onchange="selecionarPrestador(this)"
    >
      <option value="">Selecione o prestador...</option>
    </select>
    <input 
      type="text" 
      placeholder="Nome" 
      class="input-field input-small" 
      data-field="nome"
      readonly
    >
    <input 
      type="text" 
      placeholder="Função" 
      class="input-field input-small" 
      data-field="funcao"
      readonly
    >
    <div class="time-inputs-small">
      <input 
        type="time" 
        placeholder="Entrada" 
        class="input-field input-small" 
        data-field="entrada"
      >
      <input 
        type="time" 
        placeholder="Saída" 
        class="input-field input-small"
        data-field="saida"
      >
    </div>
    <input 
      type="number" 
      step="0.01"
      min="0"
      placeholder="Valor da Diária (R$)" 
      class="input-field input-small input-money" 
      data-field="valorMaoObra"
    >
    <button type="button" class="btn-remove-small" onclick="removerProfissionalServico(this)" aria-label="Remover profissional">
      <i data-lucide="x"></i>
    </button>
  `;
  profissionaisList.appendChild(novoRow);
  
  // Popular o select de prestadores
  const selectPrestador = novoRow.querySelector('select[data-field="prestadorId"]');
  if (selectPrestador) {
    atualizarSelectPrestador(selectPrestador);
  }
  
  // Reinicializar ícones
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Remover Profissional de um Serviço
function removerProfissionalServico(btn) {
  const profissionaisList = btn.closest('.profissionais-list');
  if (profissionaisList.children.length > 1) {
    btn.closest('.profissional-row').remove();
  } else {
    // Se for o último, limpar os campos
    btn.closest('.profissional-row').querySelectorAll('input').forEach(input => {
      input.value = '';
    });
  }
}

// Adicionar Serviço
function adicionarServico() {
  const container = document.getElementById('servicosContainer');
  const novoItem = document.createElement('div');
  novoItem.className = 'servico-item';
  novoItem.innerHTML = `
    <div class="servico-header">
      <input 
        type="text" 
        placeholder="Atividade" 
        class="input-field" 
        data-field="atividade"
        required
      >
    </div>
    
            <div class="profissionais-section">
              <label class="section-label">
                <i data-lucide="users" class="label-icon"></i>
                Profissionais Envolvidos
              </label>
              <div class="profissionais-list" data-field="profissionais">
                <div class="profissional-row">
                  <select 
                    class="input-field input-small" 
                    data-field="prestadorId"
                    onchange="selecionarPrestador(this)"
                  >
                    <option value="">Selecione o prestador...</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Nome" 
                    class="input-field input-small" 
                    data-field="nome"
                    readonly
                  >
                  <input 
                    type="text" 
                    placeholder="Função" 
                    class="input-field input-small" 
                    data-field="funcao"
                    readonly
                  >
                  <div class="time-inputs-small">
                    <input 
                      type="time" 
                      placeholder="Entrada" 
                      class="input-field input-small" 
                      data-field="entrada"
                    >
                    <input 
                      type="time" 
                      placeholder="Saída" 
                      class="input-field input-small"
                      data-field="saida"
                    >
                  </div>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="Valor da Diária (R$)" 
                    class="input-field input-small input-money" 
                    data-field="valorMaoObra"
                  >
                  <button type="button" class="btn-remove-small" onclick="removerProfissionalServico(this)" aria-label="Remover profissional">
                    <i data-lucide="x"></i>
                  </button>
                </div>
              </div>
              <button type="button" class="btn-add-small" onclick="adicionarProfissionalServico(this)">
                <i data-lucide="user-plus"></i>
                <span>Adicionar Profissional</span>
              </button>
            </div>
    
    <div class="servico-footer">
      <input 
        type="text" 
        placeholder="Percentual Avanço (ex: +12%)" 
        class="input-field" 
        data-field="percentualAvancado"
      >
      <textarea 
        placeholder="Observações" 
        class="input-field textarea-field" 
        data-field="observacoes"
      ></textarea>
    </div>
    
    <button type="button" class="btn-remove" onclick="removerServico(this)" aria-label="Remover serviço">
      <i data-lucide="x"></i>
    </button>
  `;
  container.appendChild(novoItem);
  
  // Popular os selects de prestadores no novo item
  const prestadorSelects = novoItem.querySelectorAll('select[data-field="prestadorId"]');
  prestadorSelects.forEach(select => {
    atualizarSelectPrestador(select);
  });
  
  // Reinicializar ícones
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Remover Serviço
function removerServico(btn) {
  const container = document.getElementById('servicosContainer');
  if (container.children.length > 1) {
    btn.closest('.servico-item').remove();
  } else {
    btn.closest('.servico-item').querySelectorAll('input, textarea').forEach(input => {
      input.value = '';
    });
  }
}

// Adicionar Pendência
function adicionarPendencia() {
  const container = document.getElementById('pendenciasContainer');
  const novoItem = document.createElement('div');
  novoItem.className = 'pendencias-item';
  novoItem.innerHTML = `
    <textarea 
      placeholder="Descrição da pendência" 
      class="input-field textarea-field" 
      data-field="descricao"
    ></textarea>
    <select class="input-field" data-field="prioridade">
      <option value="Baixa">Baixa</option>
      <option value="Média" selected>Média</option>
      <option value="Alta">Alta</option>
    </select>
    <input 
      type="text" 
      placeholder="Responsável" 
      class="input-field" 
      data-field="responsavel"
    >
    <button type="button" class="btn-remove" onclick="removerPendencia(this)" aria-label="Remover pendência">
      <i data-lucide="x"></i>
    </button>
  `;
  container.appendChild(novoItem);
  
  // Reinicializar ícones
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Remover Pendência
function removerPendencia(btn) {
  const container = document.getElementById('pendenciasContainer');
  if (container.children.length > 1) {
    btn.closest('.pendencias-item').remove();
  } else {
    btn.closest('.pendencias-item').querySelectorAll('input, textarea, select').forEach(input => {
      if (input.tagName === 'SELECT') {
        input.selectedIndex = 1; // Média
      } else {
        input.value = '';
      }
    });
  }
}


// Atualizar um select de local específico
function atualizarSelectLocal(select) {
  if (!select) return;
  
  const valorAtual = select.value;
  const isHeaderSelect = select.id === 'localId';
  const placeholder = isHeaderSelect ? 'Selecione o local...' : 'Selecione o local...';
  
  select.innerHTML = `<option value="">${placeholder}</option>`;
  
  if (locaisCadastrados && locaisCadastrados.length > 0) {
    locaisCadastrados.forEach(local => {
      const option = document.createElement('option');
      // Para o header, usar o nome do local como valor
      // Para os selects dentro dos serviços, também usar o nome
      option.value = local.nome;
      option.textContent = local.nome;
      select.appendChild(option);
    });
  } else {
    // Se não houver locais, adicionar uma opção informativa
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Nenhum local cadastrado';
    option.disabled = true;
    select.appendChild(option);
  }
  
  if (valorAtual) {
    select.value = valorAtual;
  }
}

// Função removida - GPS agora é automático

// Submeter formulário
document.getElementById('diarioForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('.btn-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Registrando...';

  try {
    // Coletar serviços (agora com profissionais integrados)
    const servicos = [];
    const profissionaisGeral = []; // Para manter compatibilidade com backend
    
    // Obter o local selecionado no header
    const localSelecionado = document.getElementById('localId').value;
    
    if (!localSelecionado) {
      mostrarMensagem('Selecione o local no topo do formulário.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="save"></i><span>Registrar Diário de Obra</span>';
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      return;
    }
    
    document.querySelectorAll('.servico-item').forEach(item => {
      const atividade = item.querySelector('[data-field="atividade"]').value.trim();
      const percentualAvancado = item.querySelector('[data-field="percentualAvancado"]').value.trim();
      const observacoes = item.querySelector('[data-field="observacoes"]').value.trim();

      // Coletar profissionais deste serviço
      const profissionaisServico = [];
      item.querySelectorAll('.profissional-row').forEach(row => {
        const nome = row.querySelector('[data-field="nome"]').value.trim();
        const funcao = row.querySelector('[data-field="funcao"]').value.trim();
        const entrada = row.querySelector('[data-field="entrada"]').value;
        const saida = row.querySelector('[data-field="saida"]').value;
        const valorMaoObra = row.querySelector('[data-field="valorMaoObra"]')?.value.trim() || '0';

        if (nome && funcao && entrada) {
          let horasTrabalhadas = '';
          if (entrada && saida) {
            const [hEntrada, mEntrada] = entrada.split(':').map(Number);
            const [hSaida, mSaida] = saida.split(':').map(Number);
            const minutosEntrada = hEntrada * 60 + mEntrada;
            const minutosSaida = hSaida * 60 + mSaida;
            const minutosTrabalhados = minutosSaida - minutosEntrada;
            const horas = Math.floor(minutosTrabalhados / 60);
            const minutos = minutosTrabalhados % 60;
            horasTrabalhadas = `${horas}h${minutos.toString().padStart(2, '0')}min`;
          }

          const prof = {
            nome,
            funcao,
            entrada,
            saida: saida || '',
            horasTrabalhadas,
            valorMaoObra: valorMaoObra ? parseFloat(valorMaoObra) : 0,
          };
          
          profissionaisServico.push(prof);
          // Adicionar também à lista geral para compatibilidade
          profissionaisGeral.push(prof);
        }
      });

      if (atividade) {
        const obraSelecionada = document.getElementById('obraId')?.value || '';
        servicos.push({
          atividade,
          obra: obraSelecionada, // Incluir obra selecionada
          local: localSelecionado, // Usar o local selecionado no header
          profissionaisEnvolvidos: profissionaisServico.map(p => `${p.nome} - ${p.funcao}`),
          profissionaisDetalhados: profissionaisServico, // Para manter detalhes
          percentualAvancado,
          observacoes,
        });
      }
    });
    
    // Validar se há pelo menos um serviço com profissionais
    const temProfissionais = servicos.some(s => s.profissionaisEnvolvidos.length > 0);
    if (!temProfissionais && profissionaisGeral.length === 0) {
      mostrarMensagem('Adicione pelo menos um profissional em um dos serviços.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="save"></i><span>Registrar Diário de Obra</span>';
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      return;
    }

    // Coletar pendências
    const pendencias = [];
    const obraSelecionadaPend = document.getElementById('obraId')?.value || '';
    const localSelecionadoPend = document.getElementById('localId')?.value || '';
    
    document.querySelectorAll('.pendencias-item').forEach(item => {
      const descricao = item.querySelector('[data-field="descricao"]').value.trim();
      const prioridade = item.querySelector('[data-field="prioridade"]').value;
      const responsavel = item.querySelector('[data-field="responsavel"]').value.trim();

      if (descricao) {
        pendencias.push({
          obra: obraSelecionadaPend,
          local: localSelecionadoPend,
          descricao,
          prioridade,
          status: 'Pendente', // Status padrão
          responsavel,
        });
      }
    });

    // Preparar FormData
    const formData = new FormData();
    formData.append('data', document.getElementById('data').value);
    // Obter a obra selecionada
    const obraId = document.getElementById('obraId')?.value || '';
    const localId = document.getElementById('localId').value;
    formData.append('obraId', obraId);
    formData.append('localId', localId);
    // Enviar profissionais gerais (todos os profissionais de todos os serviços)
    formData.append('profissionais', JSON.stringify(profissionaisGeral));
    formData.append('servicos', JSON.stringify(servicos));
    formData.append('pendencias', JSON.stringify(pendencias));


    // Enviar para o servidor
    const response = await fetch('/api/diario/registrar', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      // Mostrar mensagem de sucesso
      const mensagemSucesso = '✓ Diário de obra registrado com sucesso! Os dados foram salvos na planilha.';
      mostrarMensagem(mensagemSucesso, 'success');
      
      // Fazer scroll para a mensagem
      const messageDiv = document.getElementById('message');
      if (messageDiv) {
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Limpar formulário após 4 segundos para dar tempo de ver a mensagem
      setTimeout(() => {
        window.location.reload();
      }, 4000);
    } else {
      mostrarMensagem(result.error || 'Erro ao registrar diário de obra', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Registrar Diário de Obra';
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao registrar diário de obra: ' + error.message, 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Registrar Diário de Obra';
  }
});

// Mostrar mensagem
function mostrarMensagem(texto, tipo) {
  const messageDiv = document.getElementById('message');
  if (!messageDiv) return;
  
  messageDiv.textContent = texto;
  messageDiv.className = `message ${tipo}`;
  messageDiv.style.display = 'block';

  // Para mensagens de erro, esconder após 5 segundos
  // Para mensagens de sucesso, não esconder automaticamente (será feito pelo reload)
  if (tipo === 'error') {
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }
}

