// Variáveis globais
let locaisCadastrados = [];
let obrasCadastradas = [];
let currentUser = null;

// Verificar autenticação e carregar dados
document.addEventListener('DOMContentLoaded', async () => {
  await verificarAutenticacao();
  await carregarLocais();
  await carregarObras();
  await carregarCompras();
  
  // Configurar data atual
  const dataInput = document.getElementById('data');
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
  
  // Preview do arquivo
  document.getElementById('anexo').addEventListener('change', handleFileChange);
  
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
    sidebarUserName.textContent = currentUser.nome || currentUser.email || 'Usuário';
  }
}

// Verificar autenticação
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

// Carregar locais
async function carregarLocais() {
  try {
    const response = await fetch('/api/locais', {
      credentials: 'include',
    });

    if (response.ok) {
      locaisCadastrados = await response.json();
      const select = document.getElementById('localId');
      select.innerHTML = '<option value="">Selecione o local...</option>';
      
      locaisCadastrados.forEach(local => {
        const option = document.createElement('option');
        option.value = local.nome;
        option.textContent = local.nome;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar locais:', error);
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
      const select = document.getElementById('obraId');
      select.innerHTML = '<option value="">Selecione a obra...</option>';
      
      obrasCadastradas.forEach(obra => {
        const option = document.createElement('option');
        option.value = obra.descricao;
        option.textContent = obra.descricao;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar obras:', error);
  }
}

// Carregar compras
async function carregarCompras() {
  try {
    const response = await fetch('/api/compras', {
      credentials: 'include',
    });

    if (response.ok) {
      const compras = await response.json();
      exibirCompras(compras);
    } else {
      document.getElementById('comprasList').innerHTML = '<p class="error">Erro ao carregar compras</p>';
    }
  } catch (error) {
    console.error('Erro ao carregar compras:', error);
    document.getElementById('comprasList').innerHTML = '<p class="error">Erro ao carregar compras</p>';
  }
}

function exibirCompras(compras) {
  const container = document.getElementById('comprasList');
  
  if (compras.length === 0) {
    container.innerHTML = '<p class="empty">Nenhuma compra registrada ainda.</p>';
    return;
  }

  container.innerHTML = compras.map(compra => `
    <div class="compra-item">
      <div class="compra-info">
        <div class="compra-header-info">
          <h3>${compra.fornecedor || 'Sem fornecedor'}</h3>
          <span class="compra-valor">R$ ${parseFloat(compra.valorNota || 0).toFixed(2).replace('.', ',')}</span>
        </div>
        <div class="compra-details">
          <div class="compra-detail-row">
            <span class="compra-label">
              <i data-lucide="building-2" class="info-icon"></i>
              Obra:
            </span>
            <span class="compra-value">${compra.obra || 'Não informada'}</span>
          </div>
          <div class="compra-detail-row">
            <span class="compra-label">
              <i data-lucide="map-pin" class="info-icon"></i>
              Local:
            </span>
            <span class="compra-value">${compra.local || 'Não informado'}</span>
          </div>
          ${compra.comprador ? `
            <div class="compra-detail-row">
              <span class="compra-label">
                <i data-lucide="user" class="info-icon"></i>
                Comprador:
              </span>
              <span class="compra-value">${compra.comprador}</span>
            </div>
          ` : ''}
          <div class="compra-detail-row">
            <span class="compra-label">
              <i data-lucide="calendar" class="info-icon"></i>
              Data:
            </span>
            <span class="compra-value">${new Date(compra.data).toLocaleDateString('pt-BR')}</span>
          </div>
          <div class="compra-detail-row compra-descricao-row">
            <span class="compra-label">
              <i data-lucide="file-text" class="info-icon"></i>
              Descrição:
            </span>
            <span class="compra-value compra-descricao">${compra.descricao || 'Sem descrição'}</span>
          </div>
          ${compra.anexo ? `
            <div class="compra-detail-row">
              <span class="compra-label">
                <i data-lucide="paperclip" class="info-icon"></i>
                Anexo:
              </span>
              <a href="/api/compras/anexo/${compra.id}" target="_blank" class="compra-anexo-link">
                Ver anexo
              </a>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="compra-actions">
        <button type="button" class="btn-edit" onclick="editarCompra('${compra.id}')" aria-label="Editar compra" title="Editar">
          <i data-lucide="edit-2"></i>
        </button>
        <button type="button" class="btn-remove" onclick="deletarCompra('${compra.id}')" aria-label="Deletar compra" title="Excluir">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </div>
  `).join('');
  
  // Reinicializar ícones
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Handle file change
function handleFileChange(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('filePreview');
  const fileName = document.getElementById('fileName');
  
  if (file) {
    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      mostrarMensagem('Arquivo muito grande. Máximo permitido: 10MB', 'error');
      e.target.value = '';
      preview.style.display = 'none';
      return;
    }
    
    fileName.textContent = file.name;
    preview.style.display = 'flex';
  } else {
    preview.style.display = 'none';
  }
}

// Remover anexo
function removerAnexo() {
  document.getElementById('anexo').value = '';
  document.getElementById('filePreview').style.display = 'none';
}

// Editar compra
async function editarCompra(id) {
  try {
    // Buscar dados da compra
    const response = await fetch('/api/compras', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar compras');
    }

    const compras = await response.json();
    const compra = compras.find(c => c.id === id);

    if (!compra) {
      mostrarMensagem('Compra não encontrada', 'error');
      return;
    }

    // Preencher formulário de edição
    document.getElementById('editCompraId').value = compra.id;
    document.getElementById('editObraId').value = compra.obra || '';
    document.getElementById('editLocalId').value = compra.local || '';
    document.getElementById('editData').value = compra.data ? new Date(compra.data).toISOString().split('T')[0] : '';
    document.getElementById('editFornecedor').value = compra.fornecedor || '';
    document.getElementById('editComprador').value = compra.comprador || '';
    document.getElementById('editValorNota').value = compra.valorNota || '';
    document.getElementById('editDescricao').value = compra.descricao || '';

    // Preencher selects de obra e local
    const editObraSelect = document.getElementById('editObraId');
    const editLocalSelect = document.getElementById('editLocalId');
    
    // Limpar e preencher obras
    editObraSelect.innerHTML = '<option value="">Selecione a obra...</option>';
    obrasCadastradas.forEach(obra => {
      const option = document.createElement('option');
      option.value = obra.descricao;
      option.textContent = obra.descricao;
      if (obra.descricao === compra.obra) {
        option.selected = true;
      }
      editObraSelect.appendChild(option);
    });

    // Limpar e preencher locais
    editLocalSelect.innerHTML = '<option value="">Selecione o local...</option>';
    locaisCadastrados.forEach(local => {
      const option = document.createElement('option');
      option.value = local.nome;
      option.textContent = local.nome;
      if (local.nome === compra.local) {
        option.selected = true;
      }
      editLocalSelect.appendChild(option);
    });

    // Abrir modal
    document.getElementById('editModal').style.display = 'flex';
    
    // Preview do arquivo
    document.getElementById('editAnexo').addEventListener('change', handleFileChangeEdicao);
    
    // Reinicializar ícones
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (error) {
    console.error('Erro ao carregar compra para edição:', error);
    mostrarMensagem('Erro ao carregar compra: ' + error.message, 'error');
  }
}

// Fechar modal de edição
function fecharModalEdicao() {
  document.getElementById('editModal').style.display = 'none';
  document.getElementById('editCompraForm').reset();
  document.getElementById('editFilePreview').style.display = 'none';
}

// Handle file change (edição)
function handleFileChangeEdicao(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('editFilePreview');
  const fileName = document.getElementById('editFileName');
  
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      mostrarMensagem('Arquivo muito grande. Máximo permitido: 10MB', 'error');
      e.target.value = '';
      preview.style.display = 'none';
      return;
    }
    
    fileName.textContent = file.name;
    preview.style.display = 'flex';
  } else {
    preview.style.display = 'none';
  }
}

// Remover anexo (edição)
function removerAnexoEdicao() {
  document.getElementById('editAnexo').value = '';
  document.getElementById('editFilePreview').style.display = 'none';
}

// Deletar compra
async function deletarCompra(id) {
  if (!confirm('Tem certeza que deseja excluir esta compra?')) {
    return;
  }

  try {
    const response = await fetch(`/api/compras/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.ok) {
      mostrarMensagem('Compra excluída com sucesso!', 'success');
      await carregarCompras();
    } else {
      const error = await response.json();
      mostrarMensagem(error.error || 'Erro ao excluir compra', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao excluir compra: ' + error.message, 'error');
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

// Submeter formulário de edição
document.getElementById('editCompraForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('.btn-submit');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="loader-2" class="spinning"></i><span>Salvando...</span>';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  try {
    const formData = new FormData();
    const compraId = document.getElementById('editCompraId').value;
    formData.append('obraId', document.getElementById('editObraId').value);
    formData.append('localId', document.getElementById('editLocalId').value);
    formData.append('data', document.getElementById('editData').value);
    formData.append('fornecedor', document.getElementById('editFornecedor').value.trim());
    formData.append('comprador', document.getElementById('editComprador').value.trim());
    formData.append('valorNota', document.getElementById('editValorNota').value);
    formData.append('descricao', document.getElementById('editDescricao').value.trim());
    
    const anexoInput = document.getElementById('editAnexo');
    if (anexoInput.files && anexoInput.files.length > 0) {
      formData.append('anexo', anexoInput.files[0]);
    }

    const response = await fetch(`/api/compras/${compraId}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem(result.message || 'Compra atualizada com sucesso!', 'success');
      fecharModalEdicao();
      await carregarCompras();
    } else {
      mostrarMensagem(result.error || 'Erro ao atualizar compra', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao atualizar compra: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="save"></i><span>Salvar Alterações</span>';
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
});

// Submeter formulário
document.getElementById('compraForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('.btn-submit');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="loader-2" class="spinning"></i><span>Registrando...</span>';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  try {
    const formData = new FormData();
    formData.append('obraId', document.getElementById('obraId').value);
    formData.append('localId', document.getElementById('localId').value);
    formData.append('data', document.getElementById('data').value);
    formData.append('fornecedor', document.getElementById('fornecedor').value.trim());
    formData.append('comprador', document.getElementById('comprador').value.trim());
    formData.append('valorNota', document.getElementById('valorNota').value);
    formData.append('descricao', document.getElementById('descricao').value.trim());
    
    const anexoInput = document.getElementById('anexo');
    if (anexoInput.files && anexoInput.files.length > 0) {
      formData.append('anexo', anexoInput.files[0]);
    }

    const response = await fetch('/api/compras', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem(result.message || 'Compra registrada com sucesso!', 'success');
      // Limpar formulário
      e.target.reset();
      document.getElementById('filePreview').style.display = 'none';
      const dataInput = document.getElementById('data');
      const hoje = new Date().toISOString().split('T')[0];
      dataInput.value = hoje;
      // Recarregar lista
      await carregarCompras();
    } else {
      mostrarMensagem(result.error || 'Erro ao registrar compra', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao registrar compra: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="save"></i><span>Registrar Compra</span>';
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

