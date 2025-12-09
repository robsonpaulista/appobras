let currentUser = null;
let obrasCadastradas = [];
let locaisCadastrados = [];
let servicosExecutados = [];

document.addEventListener('DOMContentLoaded', async () => {
  await verificarAutenticacao();
  await carregarObras();
  await carregarLocais();
  await carregarServicosExecutados();
  
  // Configurar formulário de edição
  document.getElementById('editServicoForm').addEventListener('submit', atualizarServico);
  
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

// Carregar obras para preencher o select
async function carregarObras() {
  try {
    const response = await fetch('/api/obras', {
      credentials: 'include',
    });

    if (response.ok) {
      obrasCadastradas = await response.json();
      const obraFilter = document.getElementById('obraFilter');
      if (obraFilter) {
        obrasCadastradas.forEach(obra => {
          const option = document.createElement('option');
          // Usar descricao como valor porque é assim que está sendo salvo na planilha
          option.value = obra.descricao || obra.nome || obra.id;
          option.textContent = obra.descricao || obra.nome || obra.id;
          obraFilter.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Erro ao carregar obras:', error);
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
      const localFilter = document.getElementById('localFilter');
      if (localFilter) {
        locaisCadastrados.forEach(local => {
          const option = document.createElement('option');
          option.value = local.id;
          option.textContent = local.nome || local.id;
          localFilter.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Erro ao carregar locais:', error);
  }
}

// Carregar serviços executados
async function carregarServicosExecutados() {
  const servicosList = document.getElementById('servicosList');
  if (!servicosList) return;

  try {
    servicosList.innerHTML = '<p class="loading">Carregando serviços...</p>';

    const obraId = document.getElementById('obraFilter')?.value || '';
    const localId = document.getElementById('localFilter')?.value || '';
    const dataInicio = document.getElementById('dataInicio')?.value || '';
    const dataFim = document.getElementById('dataFim')?.value || '';

    const params = new URLSearchParams();
    if (obraId) params.append('obraId', obraId);
    if (localId) params.append('localId', localId);
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);

    const response = await fetch(`/api/diario/servicos-executados?${params.toString()}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || `Erro ${response.status}: ${response.statusText}`);
    }

    servicosExecutados = await response.json();
    
    if (!Array.isArray(servicosExecutados)) {
      console.error('Resposta inválida da API:', servicosExecutados);
      throw new Error('Formato de resposta inválido');
    }

    if (servicosExecutados.length === 0) {
      servicosList.innerHTML = '<p class="empty">Nenhum serviço encontrado com os filtros aplicados.</p>';
      return;
    }

    // Agrupar serviços por data
    const servicosPorData = {};
    servicosExecutados.forEach(servico => {
      const data = servico.data || 'Sem data';
      if (!servicosPorData[data]) {
        servicosPorData[data] = [];
      }
      servicosPorData[data].push(servico);
    });

    // Ordenar datas (mais recente primeiro)
    const datasOrdenadas = Object.keys(servicosPorData).sort((a, b) => {
      const dataA = new Date(a);
      const dataB = new Date(b);
      return dataB - dataA;
    });

    // Renderizar serviços agrupados por data
    servicosList.innerHTML = '';
    datasOrdenadas.forEach(data => {
      const servicosDoDia = servicosPorData[data];
      
      // Criar container da data
      const dataContainer = document.createElement('div');
      dataContainer.className = 'ios-grouped-container';
      dataContainer.style.marginBottom = '24px';
      
      // Cabeçalho da data
      const dataHeader = document.createElement('div');
      dataHeader.style.padding = '16px';
      dataHeader.style.borderBottom = '0.5px solid var(--ios-separator)';
      dataHeader.style.background = 'var(--ios-bg-secondary)';
      
      const dataFormatada = formatarData(data);
      dataHeader.innerHTML = `
        <h3 style="margin: 0; font-size: 17px; font-weight: 600; color: var(--ios-text-primary);">
          <i data-lucide="calendar" style="width: 18px; height: 18px; margin-right: 8px; vertical-align: middle;"></i>
          ${dataFormatada}
        </h3>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--ios-text-secondary);">
          ${servicosDoDia.length} ${servicosDoDia.length === 1 ? 'serviço registrado' : 'serviços registrados'}
        </p>
      `;
      
      dataContainer.appendChild(dataHeader);
      
      // Lista de serviços do dia
      servicosDoDia.forEach((servico, index) => {
        const servicoItem = document.createElement('div');
        servicoItem.className = 'compra-item';
        servicoItem.style.borderRadius = '0';
        if (index === servicosDoDia.length - 1) {
          servicoItem.style.borderBottom = 'none';
        }
        
        servicoItem.innerHTML = `
          <div class="compra-info" style="flex: 1;">
            <div class="compra-header-info">
              <h3>${servico.atividade || 'Sem atividade'}</h3>
            </div>
            <div class="compra-details">
              ${servico.obra ? `
                <div class="compra-detail-row">
                  <span class="compra-label">
                    <i data-lucide="building-2" class="info-icon"></i>
                    Obra:
                  </span>
                  <span class="compra-value">${servico.obra}</span>
                </div>
              ` : ''}
              ${servico.local ? `
                <div class="compra-detail-row">
                  <span class="compra-label">
                    <i data-lucide="map-pin" class="info-icon"></i>
                    Local:
                  </span>
                  <span class="compra-value">${servico.local}</span>
                </div>
              ` : ''}
              ${servico.profissionaisEnvolvidos ? `
                <div class="compra-detail-row">
                  <span class="compra-label">
                    <i data-lucide="users" class="info-icon"></i>
                    Profissionais:
                  </span>
                  <span class="compra-value">${servico.profissionaisEnvolvidos}</span>
                </div>
              ` : ''}
              ${servico.percentualAvancado ? `
                <div class="compra-detail-row">
                  <span class="compra-label">
                    <i data-lucide="trending-up" class="info-icon"></i>
                    Avanço:
                  </span>
                  <span class="compra-value" style="color: var(--ios-blue); font-weight: 500;">${servico.percentualAvancado}</span>
                </div>
              ` : ''}
              ${servico.observacoes ? `
                <div class="compra-detail-row">
                  <span class="compra-label">
                    <i data-lucide="file-text" class="info-icon"></i>
                    Observações:
                  </span>
                  <span class="compra-value" style="font-style: italic;">${servico.observacoes}</span>
                </div>
              ` : ''}
            </div>
          </div>
          <div class="compra-actions">
            <button type="button" class="btn-edit" data-action="edit" data-id="${servico.id}" aria-label="Editar serviço" title="Editar">
              <i data-lucide="edit-2"></i>
            </button>
            <button type="button" class="btn-remove" data-action="delete" data-id="${servico.id}" aria-label="Deletar serviço" title="Excluir">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        `;
        
        dataContainer.appendChild(servicoItem);
      });
      
      servicosList.appendChild(dataContainer);
      
      // Adicionar event listeners usando delegação de eventos
      dataContainer.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;
        
        const action = button.getAttribute('data-action');
        const id = button.getAttribute('data-id');
        
        if (action === 'edit' && id) {
          editarServico(id);
        } else if (action === 'delete' && id) {
          deletarServico(id);
        }
      });
    });

    // Reinicializar ícones
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (error) {
    console.error('Erro ao carregar serviços:', error);
    servicosList.innerHTML = `
      <p class="empty" style="color: var(--ios-red); padding: 20px; text-align: center;">
        <strong>Erro ao carregar serviços</strong><br>
        <span style="font-size: 13px; color: var(--ios-text-secondary);">${error.message || 'Erro desconhecido'}</span>
      </p>
    `;
  }
}

// Formatar data para exibição
function formatarData(data) {
  if (!data) return 'Sem data';
  
  try {
    let dataObj;
    
    // Se a data já vier formatada como YYYY-MM-DD do backend
    if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
      const partes = data.split('-');
      dataObj = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
    }
    // Tentar diferentes formatos de data
    else if (typeof data === 'number') {
      // Se for número, pode ser serial do Google Sheets
      // Google Sheets serial date: 1 = 30/12/1899
      if (data > 100000) {
        // Provavelmente timestamp em milissegundos
        dataObj = new Date(data);
      } else if (data > 0 && data < 100000) {
        // Provavelmente serial do Google Sheets
        const excelEpoch = new Date(1899, 11, 30); // 30 de dezembro de 1899
        dataObj = new Date(excelEpoch.getTime() + (data - 1) * 24 * 60 * 60 * 1000);
      } else {
        dataObj = new Date(data);
      }
    } else if (typeof data === 'string') {
      // Tentar parsear string de data
      // Primeiro tentar formato brasileiro DD/MM/YYYY
      const partes = data.split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1; // Mês é 0-indexed
        const ano = parseInt(partes[2], 10);
        dataObj = new Date(ano, mes, dia);
      } else {
        // Tentar parse padrão ISO ou outros formatos
        dataObj = new Date(data);
      }
    } else {
      dataObj = new Date(data);
    }
    
    if (isNaN(dataObj.getTime())) {
      console.warn('Data inválida:', data, typeof data);
      return data.toString();
    }
    
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = dataObj.getFullYear();
    
    // Validar se o ano está em um range razoável
    if (ano < 1900 || ano > 2100) {
      console.warn('Ano fora do range esperado:', ano, 'Data original:', data);
      return data.toString();
    }
    
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const diaSemana = diasSemana[dataObj.getDay()];
    
    return `${diaSemana}, ${dia}/${mes}/${ano}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Data original:', data);
    return data.toString();
  }
}

// Aplicar filtros
function aplicarFiltros() {
  carregarServicosExecutados();
}

// Editar serviço
async function editarServico(id) {
  try {
    // Buscar dados do serviço
    const response = await fetch('/api/diario/servicos-executados', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar serviços');
    }

    const servicos = await response.json();
    const servico = servicos.find(s => s.id === id);

    if (!servico) {
      mostrarMensagem('Serviço não encontrado', 'error');
      return;
    }

    // Preencher formulário de edição
    document.getElementById('editServicoId').value = servico.id;
    document.getElementById('editDataServico').value = servico.data ? servico.data.split('T')[0] : '';
    document.getElementById('editAtividadeServico').value = servico.atividade || '';
    document.getElementById('editObservacoesServico').value = servico.observacoes || '';
    document.getElementById('editPercentualAvancado').value = servico.percentualAvancado || '';

    // Preencher select de obra
    const editObraSelect = document.getElementById('editObraServico');
    editObraSelect.innerHTML = '<option value="">Selecione a obra...</option>';
    obrasCadastradas.forEach(obra => {
      const option = document.createElement('option');
      option.value = obra.descricao || obra.nome || obra.id;
      option.textContent = obra.descricao || obra.nome || obra.id;
      if ((obra.descricao || obra.nome || obra.id) === servico.obra) {
        option.selected = true;
      }
      editObraSelect.appendChild(option);
    });

    // Preencher select de local
    const editLocalSelect = document.getElementById('editLocalServico');
    editLocalSelect.innerHTML = '<option value="">Selecione o local...</option>';
    locaisCadastrados.forEach(local => {
      const option = document.createElement('option');
      option.value = local.nome || local.id;
      option.textContent = local.nome || local.id;
      if ((local.nome || local.id) === servico.local) {
        option.selected = true;
      }
      editLocalSelect.appendChild(option);
    });

    // Preencher profissionais (se for string, dividir por /)
    const profissionais = servico.profissionaisEnvolvidos 
      ? servico.profissionaisEnvolvidos.split(' / ').filter(p => p.trim())
      : [];
    const profissionaisContainer = document.getElementById('editProfissionaisContainer');
    profissionaisContainer.innerHTML = '';
    if (profissionais.length > 0) {
      profissionais.forEach(prof => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'input-field';
        input.value = prof.trim();
        input.placeholder = 'Nome do profissional';
        profissionaisContainer.appendChild(input);
      });
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'input-field';
      input.placeholder = 'Nome do profissional';
      profissionaisContainer.appendChild(input);
    }

    // Abrir modal
    document.getElementById('editModal').style.display = 'flex';
    
    // Reinicializar ícones
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (error) {
    console.error('Erro ao carregar serviço para edição:', error);
    mostrarMensagem('Erro ao carregar serviço: ' + error.message, 'error');
  }
}

// Fechar modal de edição
function fecharModalEdicao() {
  document.getElementById('editModal').style.display = 'none';
  document.getElementById('editServicoForm').reset();
  document.getElementById('editProfissionaisContainer').innerHTML = '<input type="text" class="input-field" placeholder="Nome do profissional">';
}

// Adicionar profissional no modal de edição
function adicionarProfissionalEdit() {
  const container = document.getElementById('editProfissionaisContainer');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'input-field';
  input.placeholder = 'Nome do profissional';
  container.appendChild(input);
}

// Atualizar serviço
async function atualizarServico(e) {
  e.preventDefault();

  const id = document.getElementById('editServicoId').value;
  const data = document.getElementById('editDataServico').value;
  const obra = document.getElementById('editObraServico')?.value || '';
  const atividade = document.getElementById('editAtividadeServico').value.trim();
  const local = document.getElementById('editLocalServico')?.value || '';
  const percentualAvancado = document.getElementById('editPercentualAvancado').value.trim() || '';
  const observacoes = document.getElementById('editObservacoesServico').value.trim() || '';
  
  // Coletar profissionais
  const profissionaisInputs = document.querySelectorAll('#editProfissionaisContainer input');
  const profissionaisEnvolvidos = Array.from(profissionaisInputs)
    .map(input => input.value.trim())
    .filter(p => p);

  const submitBtn = e.target.querySelector('.btn-submit');

  if (!atividade) {
    mostrarMensagem('Atividade é obrigatória', 'error');
    document.getElementById('editAtividadeServico').focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="loader-2"></i><span>Salvando...</span>';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  try {
    const response = await fetch(`/api/diario/servicos-executados/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        data,
        obra,
        atividade,
        local,
        profissionaisEnvolvidos,
        percentualAvancado,
        observacoes,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem('Serviço atualizado com sucesso!', 'success');
      fecharModalEdicao();
      await carregarServicosExecutados();
    } else {
      mostrarMensagem(result.error || 'Erro ao atualizar serviço', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao atualizar serviço: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="save"></i><span>Salvar Alterações</span>';
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Deletar serviço
async function deletarServico(id) {
  if (!confirm('Tem certeza que deseja excluir este serviço?')) {
    return;
  }

  try {
    const response = await fetch(`/api/diario/servicos-executados/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.ok) {
      mostrarMensagem('Serviço deletado com sucesso!', 'success');
      await carregarServicosExecutados();
    } else {
      const result = await response.json();
      mostrarMensagem(result.error || 'Erro ao deletar serviço', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao deletar serviço: ' + error.message, 'error');
  }
}

// Mostrar mensagem
function mostrarMensagem(texto, tipo) {
  const messageDiv = document.getElementById('message');
  if (!messageDiv) return;
  
  messageDiv.textContent = texto;
  messageDiv.className = `message ${tipo}`;
  messageDiv.style.display = 'block';

  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 5000);
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

