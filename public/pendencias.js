let currentUser = null;
let obrasCadastradas = [];
let locaisCadastrados = [];
let pendenciasRegistradas = [];

document.addEventListener('DOMContentLoaded', async () => {
  await verificarAutenticacao();
  await carregarObras();
  await carregarLocais();
  await carregarPendencias();
  
  // Configurar formulário de edição
  document.getElementById('editPendenciaForm').addEventListener('submit', atualizarPendencia);
  
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

// Carregar pendências
async function carregarPendencias() {
  const pendenciasList = document.getElementById('pendenciasList');
  if (!pendenciasList) return;

  try {
    pendenciasList.innerHTML = '<p class="loading">Carregando pendências...</p>';

    const obraId = document.getElementById('obraFilter')?.value || '';
    const localId = document.getElementById('localFilter')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';
    const dataInicio = document.getElementById('dataInicio')?.value || '';
    const dataFim = document.getElementById('dataFim')?.value || '';

    const params = new URLSearchParams();
    if (obraId) params.append('obraId', obraId);
    if (localId) params.append('localId', localId);
    if (status) params.append('status', status);
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);

    const response = await fetch(`/api/diario/pendencias?${params.toString()}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }

    pendenciasRegistradas = await response.json();
    
    if (!Array.isArray(pendenciasRegistradas)) {
      console.error('Resposta inválida da API:', pendenciasRegistradas);
      throw new Error('Formato de resposta inválido');
    }

    if (pendenciasRegistradas.length === 0) {
      pendenciasList.innerHTML = '<p class="empty">Nenhuma pendência encontrada com os filtros aplicados.</p>';
      return;
    }

    // Agrupar pendências por data
    const pendenciasPorData = {};
    pendenciasRegistradas.forEach(pendencia => {
      const data = pendencia.data || 'Sem data';
      if (!pendenciasPorData[data]) {
        pendenciasPorData[data] = [];
      }
      pendenciasPorData[data].push(pendencia);
    });

    // Ordenar datas (mais recente primeiro)
    const datasOrdenadas = Object.keys(pendenciasPorData).sort((a, b) => {
      const dataA = new Date(a);
      const dataB = new Date(b);
      return dataB - dataA;
    });

    // Renderizar pendências agrupadas por data
    pendenciasList.innerHTML = '';
    datasOrdenadas.forEach(data => {
      const pendenciasDoDia = pendenciasPorData[data];
      
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
          ${pendenciasDoDia.length} ${pendenciasDoDia.length === 1 ? 'pendência registrada' : 'pendências registradas'}
        </p>
      `;
      
      dataContainer.appendChild(dataHeader);
      
      // Lista de pendências do dia
      pendenciasDoDia.forEach((pendencia, index) => {
        const pendenciaItem = document.createElement('div');
        pendenciaItem.className = 'compra-item';
        pendenciaItem.style.borderRadius = '0';
        if (index === pendenciasDoDia.length - 1) {
          pendenciaItem.style.borderBottom = 'none';
        }
        
        // Cor da prioridade
        const prioridadeClass = pendencia.prioridade === 'Alta' ? 'var(--ios-red)' : 
                                pendencia.prioridade === 'Média' ? 'var(--ios-orange)' : 
                                'var(--ios-text-secondary)';
        
        // Cor do status
        const statusClass = pendencia.status === 'Resolvida' ? 'var(--ios-green)' :
                           pendencia.status === 'Em Andamento' ? 'var(--ios-blue)' :
                           'var(--ios-text-secondary)';
        
        pendenciaItem.innerHTML = `
          <div class="compra-info" style="flex: 1;">
            <div class="compra-header-info">
              <h3>${pendencia.descricao || 'Sem descrição'}</h3>
            </div>
            <div class="compra-details">
              ${pendencia.obra ? `
                <div class="compra-detail-row">
                  <span class="compra-label">
                    <i data-lucide="building-2" class="info-icon"></i>
                    Obra:
                  </span>
                  <span class="compra-value">${pendencia.obra}</span>
                </div>
              ` : ''}
              ${pendencia.local ? `
                <div class="compra-detail-row">
                  <span class="compra-label">
                    <i data-lucide="map-pin" class="info-icon"></i>
                    Local:
                  </span>
                  <span class="compra-value">${pendencia.local}</span>
                </div>
              ` : ''}
              <div class="compra-detail-row">
                <span class="compra-label">
                  <i data-lucide="alert-triangle" class="info-icon"></i>
                  Prioridade:
                </span>
                <span class="compra-value" style="color: ${prioridadeClass}; font-weight: 500;">${pendencia.prioridade || 'Média'}</span>
              </div>
              <div class="compra-detail-row">
                <span class="compra-label">
                  <i data-lucide="check-circle" class="info-icon"></i>
                  Status:
                </span>
                <span class="compra-value" style="color: ${statusClass}; font-weight: 500;">${pendencia.status || 'Pendente'}</span>
              </div>
              ${pendencia.responsavel ? `
                <div class="compra-detail-row">
                  <span class="compra-label">
                    <i data-lucide="user" class="info-icon"></i>
                    Responsável:
                  </span>
                  <span class="compra-value">${pendencia.responsavel}</span>
                </div>
              ` : ''}
            </div>
          </div>
          <div class="compra-actions">
            <button type="button" class="btn-edit" data-action="edit" data-id="${pendencia.id}" aria-label="Editar pendência" title="Editar">
              <i data-lucide="edit-2"></i>
            </button>
            <button type="button" class="btn-remove" data-action="delete" data-id="${pendencia.id}" aria-label="Deletar pendência" title="Excluir">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        `;
        
        dataContainer.appendChild(pendenciaItem);
      });
      
      pendenciasList.appendChild(dataContainer);
      
      // Adicionar event listeners usando delegação de eventos
      dataContainer.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;
        
        const action = button.getAttribute('data-action');
        const id = button.getAttribute('data-id');
        
        if (action === 'edit' && id) {
          editarPendencia(id);
        } else if (action === 'delete' && id) {
          deletarPendencia(id);
        }
      });
    });

    // Reinicializar ícones
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (error) {
    console.error('Erro ao carregar pendências:', error);
    pendenciasList.innerHTML = `
      <p class="empty" style="color: var(--ios-red); padding: 20px; text-align: center;">
        <strong>Erro ao carregar pendências</strong><br>
        <span style="font-size: 13px; color: var(--ios-text-secondary);">${error.message || 'Erro desconhecido'}</span>
      </p>
    `;
  }
}

// Formatar data para exibição
function formatarData(data) {
  if (!data) return 'Sem data';
  
  try {
    // Se a data já vier formatada como YYYY-MM-DD do backend
    if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
      const partes = data.split('-');
      const dataObj = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
      if (!isNaN(dataObj.getTime())) {
        const dia = String(dataObj.getDate()).padStart(2, '0');
        const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
        const ano = dataObj.getFullYear();
        const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const diaSemana = diasSemana[dataObj.getDay()];
        return `${diaSemana}, ${dia}/${mes}/${ano}`;
      }
    }
    
    // Tentar parse direto
    const dataObj = new Date(data);
    if (isNaN(dataObj.getTime())) {
      console.warn('Data inválida:', data);
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
  carregarPendencias();
}

// Editar pendência
async function editarPendencia(id) {
  try {
    // Primeiro tentar usar os dados já carregados
    let pendencia = null;
    
    if (pendenciasRegistradas && Array.isArray(pendenciasRegistradas) && pendenciasRegistradas.length > 0) {
      pendencia = pendenciasRegistradas.find(p => p && p.id === id);
    }
    
    // Se não encontrar nos dados carregados, buscar novamente sem filtros
    if (!pendencia) {
      console.log('Pendência não encontrada nos dados carregados, buscando da API...');
      const response = await fetch('/api/diario/pendencias', {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || `Erro ${response.status}: ${response.statusText}`;
        console.error('Erro na resposta da API:', errorMessage);
        throw new Error(errorMessage);
      }

      const pendencias = await response.json();
      
      if (!Array.isArray(pendencias)) {
        throw new Error('Formato de resposta inválido da API');
      }
      
      pendencia = pendencias.find(p => p && p.id === id);
    }

    if (!pendencia) {
      mostrarMensagem('Pendência não encontrada', 'error');
      return;
    }

    // Preencher formulário de edição
    document.getElementById('editPendenciaId').value = pendencia.id;
    
    // Converter data para formato YYYY-MM-DD
    let dataFormatada = '';
    if (pendencia.data) {
      try {
        // Se já estiver no formato YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(pendencia.data)) {
          dataFormatada = pendencia.data;
        } else if (pendencia.data.includes('T')) {
          // Se tiver timestamp, pegar só a data
          dataFormatada = pendencia.data.split('T')[0];
        } else if (pendencia.data.includes('/')) {
          // Se estiver no formato DD/MM/YYYY
          const partes = pendencia.data.split('/');
          if (partes.length === 3) {
            dataFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
          }
        } else {
          // Tentar parsear como Date
          const date = new Date(pendencia.data);
          if (!isNaN(date.getTime())) {
            const ano = date.getFullYear();
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const dia = String(date.getDate()).padStart(2, '0');
            dataFormatada = `${ano}-${mes}-${dia}`;
          }
        }
      } catch (e) {
        console.error('Erro ao converter data:', e);
      }
    }
    
    document.getElementById('editDataPendencia').value = dataFormatada;
    document.getElementById('editDescricaoPendencia').value = pendencia.descricao || '';
    document.getElementById('editPrioridadePendencia').value = pendencia.prioridade || 'Média';
    document.getElementById('editStatusPendencia').value = pendencia.status || 'Pendente';
    document.getElementById('editResponsavelPendencia').value = pendencia.responsavel || '';

    // Preencher select de obra
    const editObraSelect = document.getElementById('editObraPendencia');
    editObraSelect.innerHTML = '<option value="">Selecione a obra...</option>';
    obrasCadastradas.forEach(obra => {
      const option = document.createElement('option');
      option.value = obra.descricao || obra.nome || obra.id;
      option.textContent = obra.descricao || obra.nome || obra.id;
      if ((obra.descricao || obra.nome || obra.id) === pendencia.obra) {
        option.selected = true;
      }
      editObraSelect.appendChild(option);
    });

    // Preencher select de local
    const editLocalSelect = document.getElementById('editLocalPendencia');
    editLocalSelect.innerHTML = '<option value="">Selecione o local...</option>';
    locaisCadastrados.forEach(local => {
      const option = document.createElement('option');
      option.value = local.nome || local.id;
      option.textContent = local.nome || local.id;
      if ((local.nome || local.id) === pendencia.local) {
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
    console.error('Erro ao carregar pendência para edição:', error);
    mostrarMensagem('Erro ao carregar pendência: ' + error.message, 'error');
  }
}

// Fechar modal de edição
function fecharModalEdicao() {
  document.getElementById('editModal').style.display = 'none';
  document.getElementById('editPendenciaForm').reset();
}

// Atualizar pendência
async function atualizarPendencia(e) {
  e.preventDefault();

  const id = document.getElementById('editPendenciaId').value;
  const data = document.getElementById('editDataPendencia').value;
  const obra = document.getElementById('editObraPendencia')?.value || '';
  const local = document.getElementById('editLocalPendencia')?.value || '';
  const descricao = document.getElementById('editDescricaoPendencia').value.trim();
  const prioridade = document.getElementById('editPrioridadePendencia').value;
  const status = document.getElementById('editStatusPendencia').value;
  const responsavel = document.getElementById('editResponsavelPendencia').value.trim() || '';
  
  const submitBtn = e.target.querySelector('.btn-submit');

  if (!descricao) {
    mostrarMensagem('Descrição é obrigatória', 'error');
    document.getElementById('editDescricaoPendencia').focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="loader-2"></i><span>Salvando...</span>';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  try {
    const response = await fetch(`/api/diario/pendencias/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        data,
        obra,
        local,
        descricao,
        prioridade,
        status,
        responsavel,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem('Pendência atualizada com sucesso!', 'success');
      fecharModalEdicao();
      await carregarPendencias();
    } else {
      mostrarMensagem(result.error || 'Erro ao atualizar pendência', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao atualizar pendência: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="save"></i><span>Salvar Alterações</span>';
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Deletar pendência
async function deletarPendencia(id) {
  if (!confirm('Tem certeza que deseja excluir esta pendência?')) {
    return;
  }

  try {
    const response = await fetch(`/api/diario/pendencias/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.ok) {
      mostrarMensagem('Pendência deletada com sucesso!', 'success');
      await carregarPendencias();
    } else {
      const result = await response.json();
      mostrarMensagem(result.error || 'Erro ao deletar pendência', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao deletar pendência: ' + error.message, 'error');
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

