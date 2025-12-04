let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  await verificarAutenticacao();
  await carregarPrestadores();
  
  document.getElementById('prestadorForm').addEventListener('submit', criarPrestador);
  document.getElementById('editPrestadorForm').addEventListener('submit', atualizarPrestador);
  
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

    const user = await response.json();
    currentUser = user;
    atualizarNomeUsuarioSidebar();
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    window.location.href = '/login.html';
  }
}

// Atualizar nome do usuário na sidebar
function atualizarNomeUsuarioSidebar() {
  const sidebarUserName = document.getElementById('sidebarUserName');
  if (sidebarUserName && currentUser) {
    sidebarUserName.textContent = currentUser.nome || currentUser.email || 'Usuário';
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

// Carregar prestadores
async function carregarPrestadores() {
  try {
    const response = await fetch('/api/prestadores', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar prestadores');
    }

    const prestadores = await response.json();
    exibirPrestadores(prestadores);
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao carregar prestadores', 'error');
    document.getElementById('prestadoresList').innerHTML = '<p class="error">Erro ao carregar prestadores</p>';
  }
}

// Exibir prestadores
function exibirPrestadores(prestadores) {
  const listContainer = document.getElementById('prestadoresList');
  
  if (!prestadores || prestadores.length === 0) {
    listContainer.innerHTML = '<p class="empty">Nenhum prestador cadastrado</p>';
    return;
  }

  listContainer.innerHTML = prestadores.map(prestador => `
    <div class="compra-item">
      <div class="compra-info">
        <div class="compra-header-info">
          <h3>${prestador.nome || 'Sem nome'}</h3>
        </div>
        <div class="compra-details">
          <div class="compra-detail-row">
            <span class="compra-label">
              <i data-lucide="briefcase" class="info-icon"></i>
              Função:
            </span>
            <span class="compra-value">${prestador.funcao || '-'}</span>
          </div>
          <div class="compra-detail-row">
            <span class="compra-label">
              <i data-lucide="dollar-sign" class="info-icon"></i>
              Valor da Diária:
            </span>
            <span class="compra-value">R$ ${formatarMoeda(prestador.valorDiaria || 0)}</span>
          </div>
        </div>
      </div>
      <div class="compra-actions">
        <button type="button" class="btn-edit" onclick="editarPrestador('${prestador.id}')" aria-label="Editar prestador" title="Editar">
          <i data-lucide="edit-2"></i>
        </button>
        <button type="button" class="btn-remove" onclick="deletarPrestador('${prestador.id}')" aria-label="Deletar prestador" title="Excluir">
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

// Formatar moeda
function formatarMoeda(valor) {
  const num = parseFloat(valor) || 0;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Criar prestador
async function criarPrestador(e) {
  e.preventDefault();

  const nomeField = document.getElementById('nomePrestador');
  if (!nomeField) {
    console.error('Campo nomePrestador não encontrado');
    mostrarMensagem('Erro: Campo não encontrado', 'error');
    return;
  }

  const nome = nomeField.value.trim();
  const funcao = document.getElementById('funcaoPrestador')?.value.trim() || '';
  const valorDiaria = document.getElementById('valorDiaria')?.value || '0';
  const submitBtn = e.target.querySelector('.btn-submit');

  if (!nome) {
    mostrarMensagem('Nome do prestador é obrigatório', 'error');
    nomeField.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="loader-2"></i><span>Criando...</span>';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  try {
    const bodyData = { 
      nome, 
      funcao, 
      valorDiaria 
    };
    
    console.log('Enviando para API:', bodyData);

    const response = await fetch('/api/prestadores', {
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
      mostrarMensagem('Prestador criado com sucesso!', 'success');
      document.getElementById('prestadorForm').reset();
      await carregarPrestadores();
    } else {
      console.error('Erro na resposta:', result);
      mostrarMensagem(result.error || 'Erro ao criar prestador', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao criar prestador: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="plus"></i><span>Criar Prestador</span>';
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Editar prestador
async function editarPrestador(id) {
  try {
    // Buscar dados do prestador
    const response = await fetch('/api/prestadores', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar prestadores');
    }

    const prestadores = await response.json();
    const prestador = prestadores.find(p => p.id === id);

    if (!prestador) {
      mostrarMensagem('Prestador não encontrado', 'error');
      return;
    }

    // Preencher formulário de edição
    document.getElementById('editPrestadorId').value = prestador.id;
    document.getElementById('editNomePrestador').value = prestador.nome || '';
    document.getElementById('editFuncaoPrestador').value = prestador.funcao || '';
    document.getElementById('editValorDiaria').value = prestador.valorDiaria || '0';

    // Abrir modal
    document.getElementById('editModal').style.display = 'flex';
    
    // Reinicializar ícones
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (error) {
    console.error('Erro ao carregar prestador para edição:', error);
    mostrarMensagem('Erro ao carregar prestador: ' + error.message, 'error');
  }
}

// Fechar modal de edição
function fecharModalEdicao() {
  document.getElementById('editModal').style.display = 'none';
  document.getElementById('editPrestadorForm').reset();
}

// Atualizar prestador
async function atualizarPrestador(e) {
  e.preventDefault();

  const id = document.getElementById('editPrestadorId').value;
  const nome = document.getElementById('editNomePrestador').value.trim();
  const funcao = document.getElementById('editFuncaoPrestador').value.trim() || '';
  const valorDiaria = document.getElementById('editValorDiaria').value || '0';
  const submitBtn = e.target.querySelector('.btn-submit');

  if (!nome) {
    mostrarMensagem('Nome do prestador é obrigatório', 'error');
    document.getElementById('editNomePrestador').focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="loader-2"></i><span>Salvando...</span>';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  try {
    const response = await fetch(`/api/prestadores/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ nome, funcao, valorDiaria }),
    });

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem('Prestador atualizado com sucesso!', 'success');
      fecharModalEdicao();
      await carregarPrestadores();
    } else {
      mostrarMensagem(result.error || 'Erro ao atualizar prestador', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao atualizar prestador: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="save"></i><span>Salvar Alterações</span>';
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Deletar prestador
async function deletarPrestador(id) {
  if (!confirm('Tem certeza que deseja excluir este prestador?')) {
    return;
  }

  try {
    const response = await fetch(`/api/prestadores/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem('Prestador deletado com sucesso!', 'success');
      await carregarPrestadores();
    } else {
      mostrarMensagem(result.error || 'Erro ao deletar prestador', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao deletar prestador: ' + error.message, 'error');
  }
}

// Mostrar mensagem
function mostrarMensagem(texto, tipo = 'info') {
  const messageDiv = document.getElementById('message');
  if (!messageDiv) return;

  messageDiv.textContent = texto;
  messageDiv.className = `message ${tipo}`;
  messageDiv.style.display = 'block';

  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 5000);
}


