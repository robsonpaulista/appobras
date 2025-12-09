// Toggle password visibility
document.getElementById('togglePassword')?.addEventListener('click', function() {
  const senhaInput = document.getElementById('senha');
  const icon = this.querySelector('[data-lucide]');
  const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
  senhaInput.setAttribute('type', type);
  
  // Atualizar ícone
  if (type === 'text') {
    icon.setAttribute('data-lucide', 'eye-off');
  } else {
    icon.setAttribute('data-lucide', 'eye');
  }
  lucide.createIcons();
});

// Form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const loginBtn = document.getElementById('loginBtn');
  const btnText = loginBtn.querySelector('.btn-text');

  // Validação básica
  if (!email || !senha) {
    mostrarMensagem('Por favor, preencha todos os campos', 'error');
    return;
  }

  // Estado de loading
  loginBtn.disabled = true;
  loginBtn.classList.add('loading');
  btnText.textContent = 'Entrando...';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, senha }),
    });

    // Verificar se a resposta é JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Servidor não está respondendo corretamente. Verifique se o servidor está rodando.');
    }

    const result = await response.json();

    if (response.ok) {
      mostrarMensagem('Login realizado com sucesso!', 'success');
      
      // Pequeno delay para feedback visual
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 800);
    } else {
      mostrarMensagem(result.error || 'Email ou senha incorretos', 'error');
      loginBtn.disabled = false;
      loginBtn.classList.remove('loading');
      btnText.textContent = 'Entrar';
      
      // Focar no campo de erro
      if (result.error.includes('Email')) {
        document.getElementById('email').focus();
      } else {
        document.getElementById('senha').focus();
      }
    }
  } catch (error) {
    // Não logar erro de rede no console para não poluir
    mostrarMensagem('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    loginBtn.disabled = false;
    loginBtn.classList.remove('loading');
    btnText.textContent = 'Entrar';
  }
});

function mostrarMensagem(texto, tipo) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = texto;
  messageDiv.className = `login-message ${tipo} show`;
  
  // Auto-hide após 5 segundos (exceto para sucesso que redireciona)
  if (tipo !== 'success') {
    setTimeout(() => {
      messageDiv.classList.remove('show');
      setTimeout(() => {
        messageDiv.textContent = '';
      }, 300);
    }, 5000);
  }
}

// Verificar se já está logado
async function verificarAutenticacao() {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });

    // 401 é esperado se não estiver autenticado - não tratar como erro
    if (response.status === 401) {
      return; // Usuário não está logado, permanece na página de login
    }

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const user = await response.json();
        if (user && user.id) {
          window.location.href = '/dashboard.html';
        }
      }
    }
  } catch (error) {
    // Erro de rede ou servidor não disponível
    // Silenciar erro pois é comportamento esperado na página de login
    // quando o servidor não está disponível ou usuário não está autenticado
  }
}

// Auto-focus no primeiro campo (melhor UX)
document.addEventListener('DOMContentLoaded', () => {
  verificarAutenticacao();
  
  // Focar no campo de email após um pequeno delay
  setTimeout(() => {
    const emailInput = document.getElementById('email');
    if (emailInput && !emailInput.value) {
      emailInput.focus();
    }
  }, 300);
});

