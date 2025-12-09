let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  await verificarAutenticacao();
  
  // Tentar carregar usuários - o backend vai verificar se é admin
  try {
    await carregarUsuarios();
  } catch (error) {
    // Se der erro 403, significa que não é admin
    if (error.status === 403) {
      mostrarMensagem('Acesso negado. Apenas administradores podem gerenciar usuários.', 'error');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 2000);
      return;
    }
    throw error;
  }
  
  document.getElementById('usuarioForm').addEventListener('submit', criarUsuario);
  document.getElementById('editUsuarioForm').addEventListener('submit', atualizarUsuario);
  
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
    
    // Debug: verificar dados do usuário
    console.log('🔍 Usuário atual:', {
      id: currentUser.id,
      nome: currentUser.nome,
      email: currentUser.email,
      isAdmin: currentUser.isAdmin,
      isAdminType: typeof currentUser.isAdmin,
      isAdminValue: currentUser.isAdmin,
      isAdminCheck: currentUser.isAdmin === true || currentUser.isAdmin === 'true',
    });
    
    atualizarNomeUsuarioSidebar();
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    window.location.href = '/login.html';
  }
}

function atualizarNomeUsuarioSidebar() {
  const sidebarUserName = document.getElementById('sidebarUserName');
  if (sidebarUserName && currentUser) {
    sidebarUserName.textContent = currentUser.nome || currentUser.email || 'Usuário';
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

async function carregarUsuarios() {
  try {
    const response = await fetch('/api/usuarios', {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        mostrarMensagem(errorData.error || 'Acesso negado. Apenas administradores podem gerenciar usuários.', 'error');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 2000);
        const error = new Error('Acesso negado');
        error.status = 403;
        throw error;
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao carregar usuários');
    }

    const usuarios = await response.json();
    exibirUsuarios(usuarios);
  } catch (error) {
    if (error.status === 403) {
      throw error; // Re-throw para ser tratado no DOMContentLoaded
    }
    console.error('Erro ao carregar usuários:', error);
    mostrarMensagem('Erro ao carregar usuários: ' + error.message, 'error');
    document.getElementById('usuariosList').innerHTML = '<p class="error">Erro ao carregar usuários</p>';
  }
}

function exibirUsuarios(usuarios) {
  const listContainer = document.getElementById('usuariosList');
  
  if (!usuarios || usuarios.length === 0) {
    listContainer.innerHTML = '<p class="empty">Nenhum usuário cadastrado</p>';
    return;
  }

  listContainer.innerHTML = usuarios.map(usuario => {
    const dataCriacao = usuario.dataCriacao 
      ? new Date(usuario.dataCriacao).toLocaleDateString('pt-BR')
      : 'N/A';
    
    return `
    <div class="compra-item">
      <div class="compra-info">
        <div class="compra-header-info">
          <h3>${usuario.nome || 'Sem nome'}</h3>
          ${usuario.isAdmin ? '<span class="badge-admin">Administrador</span>' : ''}
        </div>
        <div class="compra-details">
          <div class="compra-detail-row">
            <span class="compra-label">
              <i data-lucide="mail" class="info-icon"></i>
              Email:
            </span>
            <span class="compra-value">${usuario.email || '-'}</span>
          </div>
          <div class="compra-detail-row">
            <span class="compra-label">
              <i data-lucide="calendar" class="info-icon"></i>
              Criado em:
            </span>
            <span class="compra-value">${dataCriacao}</span>
          </div>
        </div>
      </div>
      <div class="compra-actions">
        <button type="button" class="btn-edit" onclick="editarUsuario('${usuario.id}')" aria-label="Editar usuário" title="Editar">
          <i data-lucide="edit-2"></i>
        </button>
        ${usuario.id !== currentUser?.id ? `
        <button type="button" class="btn-remove" onclick="deletarUsuario('${usuario.id}')" aria-label="Deletar usuário" title="Excluir">
          <i data-lucide="trash-2"></i>
        </button>
        ` : ''}
      </div>
    </div>
  `;
  }).join('');

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

async function criarUsuario(e) {
  e.preventDefault();

  const nome = document.getElementById('nomeUsuario').value.trim();
  const email = document.getElementById('emailUsuario').value.trim();
  const senha = document.getElementById('senhaUsuario').value;
  const isAdmin = document.getElementById('isAdminUsuario').value === 'true';
  const submitBtn = e.target.querySelector('.btn-submit');

  if (!nome || !email || !senha) {
    mostrarMensagem('Todos os campos são obrigatórios', 'error');
    return;
  }

  if (senha.length < 4) {
    mostrarMensagem('Senha deve ter pelo menos 4 caracteres', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="loader-2"></i><span>Criando...</span>';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  try {
    const response = await fetch('/api/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ nome, email, senha, isAdmin }),
    });

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem('Usuário criado com sucesso!', 'success');
      document.getElementById('usuarioForm').reset();
      await carregarUsuarios();
    } else {
      mostrarMensagem(result.error || 'Erro ao criar usuário', 'error');
    }
  } catch (error) {
    mostrarMensagem('Erro ao criar usuário: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="user-plus"></i><span>Criar Usuário</span>';
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

async function editarUsuario(id) {
  try {
    const response = await fetch(`/api/usuarios/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar usuário');
    }

    const usuario = await response.json();

    document.getElementById('editUsuarioId').value = usuario.id;
    document.getElementById('editNomeUsuario').value = usuario.nome || '';
    document.getElementById('editEmailUsuario').value = usuario.email || '';
    document.getElementById('editSenhaUsuario').value = '';
    document.getElementById('editIsAdminUsuario').value = usuario.isAdmin ? 'true' : 'false';

    // Desabilitar edição de admin se for o próprio usuário
    if (usuario.id === currentUser?.id) {
      document.getElementById('editIsAdminUsuario').disabled = true;
    } else {
      document.getElementById('editIsAdminUsuario').disabled = false;
    }

    document.getElementById('editModal').style.display = 'flex';
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (error) {
    mostrarMensagem('Erro ao carregar usuário: ' + error.message, 'error');
  }
}

function fecharModalEdicao() {
  document.getElementById('editModal').style.display = 'none';
  document.getElementById('editUsuarioForm').reset();
  document.getElementById('editIsAdminUsuario').disabled = false;
}

async function atualizarUsuario(e) {
  e.preventDefault();

  const id = document.getElementById('editUsuarioId').value;
  const nome = document.getElementById('editNomeUsuario').value.trim();
  const email = document.getElementById('editEmailUsuario').value.trim();
  const senha = document.getElementById('editSenhaUsuario').value;
  const isAdmin = document.getElementById('editIsAdminUsuario').value === 'true';
  const submitBtn = e.target.querySelector('.btn-submit');

  if (!nome || !email) {
    mostrarMensagem('Nome e email são obrigatórios', 'error');
    return;
  }

  if (senha && senha.length < 4) {
    mostrarMensagem('Senha deve ter pelo menos 4 caracteres', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i data-lucide="loader-2"></i><span>Salvando...</span>';
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  try {
    const body = { nome, email, isAdmin };
    if (senha && senha.trim()) {
      body.senha = senha;
    }

    const response = await fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem('Usuário atualizado com sucesso!', 'success');
      fecharModalEdicao();
      await carregarUsuarios();
    } else {
      mostrarMensagem(result.error || 'Erro ao atualizar usuário', 'error');
    }
  } catch (error) {
    mostrarMensagem('Erro ao atualizar usuário: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i data-lucide="save"></i><span>Salvar Alterações</span>';
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

async function deletarUsuario(id) {
  if (id === currentUser?.id) {
    mostrarMensagem('Você não pode deletar sua própria conta', 'error');
    return;
  }

  if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
    return;
  }

  try {
    const response = await fetch(`/api/usuarios/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem('Usuário deletado com sucesso!', 'success');
      await carregarUsuarios();
    } else {
      mostrarMensagem(result.error || 'Erro ao deletar usuário', 'error');
    }
  } catch (error) {
    mostrarMensagem('Erro ao deletar usuário: ' + error.message, 'error');
  }
}

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

