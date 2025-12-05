let currentUser = null;
let obras = [];
let profissionais = [];
let relatorioAtual = null;

document.addEventListener('DOMContentLoaded', async () => {
  await verificarAutenticacao();
  await carregarObras();
  await carregarProfissionais();
  
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

async function carregarObras() {
  try {
    const response = await fetch('/api/obras', {
      credentials: 'include',
    });

    if (response.ok) {
      obras = await response.json();
      const select = document.getElementById('obraFilter');
      obras.forEach(obra => {
        const option = document.createElement('option');
        // Usar descrição ou nome, e valor como descrição para filtro
        option.value = obra.descricao || obra.nome || obra.id;
        option.textContent = obra.descricao || obra.nome || 'Sem nome';
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar obras:', error);
  }
}

async function carregarProfissionais() {
  try {
    const response = await fetch('/api/prestadores', {
      credentials: 'include',
    });

    if (response.ok) {
      profissionais = await response.json();
      const select = document.getElementById('profissionalFilter');
      profissionais.forEach(prof => {
        const option = document.createElement('option');
        option.value = prof.nome || '';
        option.textContent = prof.nome || 'Sem nome';
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar profissionais:', error);
  }
}

async function abrirRelatorio(tipo) {
  const obraId = document.getElementById('obraFilter').value;
  const profissionalNome = document.getElementById('profissionalFilter').value;
  const dataInicio = document.getElementById('dataInicio').value;
  const dataFim = document.getElementById('dataFim').value;

  // Mostrar/ocultar filtro de profissional baseado no tipo
  const profissionalFilter = document.getElementById('profissionalFilter');
  if (tipo === 'profissionais') {
    profissionalFilter.style.display = 'block';
  } else {
    profissionalFilter.style.display = 'none';
  }

  const params = new URLSearchParams();
  if (obraId) params.append('obraId', obraId);
  if (profissionalNome) params.append('profissionalNome', profissionalNome);
  if (dataInicio) params.append('dataInicio', dataInicio);
  if (dataFim) params.append('dataFim', dataFim);

  try {
    const contentDiv = document.getElementById('relatorioContent');
    const dataDiv = document.getElementById('relatorioData');
    
    // Mostrar loading
    dataDiv.innerHTML = '<p class="loading">Carregando relatório...</p>';
    contentDiv.style.display = 'block';
    
    const response = await fetch(`/api/relatorios/${tipo}?${params}`, {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      relatorioAtual = { tipo, data };
      exibirRelatorio(tipo, data);
    } else {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.details || errorData.error || 'Erro ao carregar relatório';
      dataDiv.innerHTML = `<p class="empty" style="color: var(--ios-red);">${errorMessage}</p>`;
      mostrarMensagem('Erro ao carregar relatório', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    const dataDiv = document.getElementById('relatorioData');
    dataDiv.innerHTML = `<p class="empty" style="color: var(--ios-red);">Erro ao carregar relatório: ${error.message}</p>`;
    mostrarMensagem('Erro ao carregar relatório: ' + error.message, 'error');
  }
}

function exibirRelatorio(tipo, data) {
  const contentDiv = document.getElementById('relatorioContent');
  const titleDiv = document.getElementById('relatorioTitle');
  const dataDiv = document.getElementById('relatorioData');
  const exportarBtn = document.getElementById('exportarFolhaPontoBtn');

  const titulos = {
    diario: 'Relatório de Diário de Obra',
    profissionais: 'Relatório de Profissionais',
    servicos: 'Relatório de Serviços',
    pendencias: 'Relatório de Pendências',
  };

  titleDiv.textContent = titulos[tipo] || 'Relatório';
  
  // Mostrar botão de exportar apenas para relatório de profissionais
  if (tipo === 'profissionais' && exportarBtn) {
    exportarBtn.style.display = 'inline-flex';
  } else if (exportarBtn) {
    exportarBtn.style.display = 'none';
  }
  
  if (tipo === 'diario') {
    renderizarRelatorioDiario(dataDiv, data);
  } else if (tipo === 'profissionais') {
    renderizarRelatorioProfissionais(dataDiv, data);
  } else {
    dataDiv.innerHTML = '<p>Relatório em desenvolvimento. Os dados serão exibidos aqui.</p>';
  }
  
  contentDiv.style.display = 'block';
  contentDiv.scrollIntoView({ behavior: 'smooth' });
  
  // Reinicializar ícones
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function renderizarRelatorioDiario(container, data) {
  if (!data || !data.obras || data.obras.length === 0) {
    container.innerHTML = '<p class="empty">Nenhum registro encontrado para o período selecionado.</p>';
    return;
  }

  const periodo = data.periodo;
  const periodoTexto = periodo.dataInicio && periodo.dataFim
    ? `Período: ${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)}`
    : periodo.dataInicio
    ? `A partir de: ${formatarData(periodo.dataInicio)}`
    : periodo.dataFim
    ? `Até: ${formatarData(periodo.dataFim)}`
    : 'Todos os registros';

  let html = `
    <div class="relatorio-header">
      <div class="relatorio-stats">
        <div class="relatorio-stat">
          <span class="stat-label">Total de Obras</span>
          <span class="stat-value">${data.totalObras || 0}</span>
        </div>
        <div class="relatorio-stat">
          <span class="stat-label">Total de Registros</span>
          <span class="stat-value">${data.totalRegistros || 0}</span>
        </div>
      </div>
      <p class="relatorio-periodo">${periodoTexto}</p>
    </div>
  `;

  data.obras.forEach(obra => {
    html += `
      <div class="relatorio-obra-card">
        <div class="relatorio-obra-header">
          <div class="relatorio-obra-title">
            <h3>
              <i data-lucide="building-2" class="info-icon"></i>
              ${obra.obra || 'Sem nome'}
            </h3>
            ${obra.local ? `
              <p class="relatorio-obra-local">
                <i data-lucide="map-pin" class="info-icon"></i>
                ${obra.local}
              </p>
            ` : ''}
          </div>
          <span class="relatorio-obra-count">${obra.registros.length} registro(s)</span>
        </div>
        <div class="relatorio-obra-registros">
    `;

    obra.registros.forEach(registro => {
      html += `
        <div class="relatorio-registro">
          <div class="relatorio-registro-header">
            <h4>
              <i data-lucide="calendar" class="info-icon"></i>
              ${formatarData(registro.data)}
            </h4>
          </div>
      `;

      // Serviços executados
      if (registro.servicos && registro.servicos.length > 0) {
        html += `
          <div class="relatorio-secao">
            <h5>
              <i data-lucide="wrench" class="info-icon"></i>
              Serviços Executados (${registro.servicos.length})
            </h5>
            <div class="relatorio-itens">
        `;
        registro.servicos.forEach(servico => {
          html += `
            <div class="relatorio-item">
              <div class="relatorio-item-content">
                <div class="relatorio-item-header">
                  <strong>${servico.atividade || 'Sem atividade'}</strong>
                  ${servico.local ? `<span class="relatorio-item-local">${servico.local}</span>` : ''}
                </div>
                ${servico.profissionaisEnvolvidos ? `
                  <p class="relatorio-item-detail">
                    <i data-lucide="users" class="info-icon"></i>
                    ${servico.profissionaisEnvolvidos}
                  </p>
                ` : ''}
                ${servico.percentualAvancado ? `
                  <p class="relatorio-item-detail">
                    <i data-lucide="trending-up" class="info-icon"></i>
                    ${servico.percentualAvancado}% de avanço
                  </p>
                ` : ''}
                ${servico.observacoes ? `
                  <p class="relatorio-item-observacoes">${servico.observacoes}</p>
                ` : ''}
              </div>
            </div>
          `;
        });
        html += `</div></div>`;
      }

      // Pendências
      if (registro.pendencias && registro.pendencias.length > 0) {
        html += `
          <div class="relatorio-secao">
            <h5>
              <i data-lucide="alert-circle" class="info-icon"></i>
              Pendências (${registro.pendencias.length})
            </h5>
            <div class="relatorio-itens">
        `;
        registro.pendencias.forEach(pendencia => {
          const prioridadeClass = pendencia.prioridade?.toLowerCase() || 'media';
          const statusClass = pendencia.status?.toLowerCase() || 'pendente';
          html += `
            <div class="relatorio-item">
              <div class="relatorio-item-content">
                <div class="relatorio-item-header">
                  <strong>${pendencia.descricao || 'Sem descrição'}</strong>
                  <span class="relatorio-badge prioridade-${prioridadeClass}">${pendencia.prioridade || 'Média'}</span>
                  <span class="relatorio-badge status-${statusClass}">${pendencia.status || 'Pendente'}</span>
                </div>
                ${pendencia.local ? `
                  <p class="relatorio-item-detail">
                    <i data-lucide="map-pin" class="info-icon"></i>
                    ${pendencia.local}
                  </p>
                ` : ''}
                ${pendencia.responsavel ? `
                  <p class="relatorio-item-detail">
                    <i data-lucide="user" class="info-icon"></i>
                    Responsável: ${pendencia.responsavel}
                  </p>
                ` : ''}
              </div>
            </div>
          `;
        });
        html += `</div></div>`;
      }

      html += `</div>`;
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
}

function renderizarRelatorioProfissionais(container, data) {
  if (!data || !data.profissionais || data.profissionais.length === 0) {
    container.innerHTML = '<p class="empty">Nenhum registro encontrado para o período selecionado.</p>';
    return;
  }

  const periodo = data.periodo;
  const periodoTexto = periodo.dataInicio && periodo.dataFim
    ? `Período: ${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)}`
    : periodo.dataInicio
    ? `A partir de: ${formatarData(periodo.dataInicio)}`
    : periodo.dataFim
    ? `Até: ${formatarData(periodo.dataFim)}`
    : 'Todos os registros';

  let html = `
    <div class="relatorio-header">
      <div class="relatorio-stats">
        <div class="relatorio-stat">
          <span class="stat-label">Total de Profissionais</span>
          <span class="stat-value">${data.totalProfissionais || 0}</span>
        </div>
      </div>
      <p class="relatorio-periodo">${periodoTexto}</p>
    </div>
  `;

  data.profissionais.forEach(profissional => {
    html += `
      <div class="relatorio-profissional-card">
        <div class="relatorio-profissional-header">
          <div class="relatorio-profissional-info">
            <h3>
              <i data-lucide="user" class="info-icon"></i>
              ${profissional.nome}
            </h3>
            <div class="relatorio-profissional-details">
              <span class="relatorio-profissional-funcao">
                <i data-lucide="briefcase" class="info-icon"></i>
                ${profissional.funcao}
              </span>
              ${profissional.valorDiaria > 0 ? `
                <span class="relatorio-profissional-valor">
                  <i data-lucide="dollar-sign" class="info-icon"></i>
                  R$ ${profissional.valorDiaria.toFixed(2).replace('.', ',')}/diária
                </span>
              ` : ''}
            </div>
          </div>
          <div class="relatorio-profissional-totais">
            <div class="relatorio-total-item">
              <span class="relatorio-total-label">Dias Trabalhados</span>
              <span class="relatorio-total-value">${profissional.totalDias || 0}</span>
            </div>
            ${profissional.totalHoras > 0 ? `
              <div class="relatorio-total-item">
                <span class="relatorio-total-label">Total de Horas</span>
                <span class="relatorio-total-value">${Math.round(profissional.totalHoras)}h</span>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="relatorio-profissional-registros">
    `;

    profissional.registros.forEach(registro => {
      html += '<div class="relatorio-ponto-registro">';
      html += '<div class="relatorio-ponto-header">';
      html += '<div class="relatorio-ponto-data">';
      html += '<i data-lucide="calendar" class="info-icon"></i>';
      html += `<strong>${formatarData(registro.data)}</strong>`;
      html += '</div>';
      html += '<div class="relatorio-ponto-obra">';
      html += '<i data-lucide="building-2" class="info-icon"></i>';
      html += registro.obra;
      if (registro.local) {
        html += ` - ${registro.local}`;
      }
      html += '</div>';
      html += '</div>';
      
      // Calcular horas trabalhadas se não estiver disponível mas tiver entrada e saída
      let horasTrabalhadas = registro.horasTrabalhadas;
      if (!horasTrabalhadas && registro.entrada && registro.saida) {
        try {
          const [hEntrada, mEntrada] = registro.entrada.split(':').map(Number);
          const [hSaida, mSaida] = registro.saida.split(':').map(Number);
          const minutosEntrada = hEntrada * 60 + mEntrada;
          const minutosSaida = hSaida * 60 + mSaida;
          const minutosTrabalhados = minutosSaida - minutosEntrada;
          if (minutosTrabalhados > 0) {
            const horas = Math.floor(minutosTrabalhados / 60);
            const minutos = minutosTrabalhados % 60;
            horasTrabalhadas = `${horas}h${minutos.toString().padStart(2, '0')}min`;
          }
        } catch (e) {
          // Ignorar erros de cálculo
        }
      }
      
      if (registro.entrada || registro.saida) {
        html += '<div class="relatorio-ponto-horarios">';
        if (registro.entrada) {
          html += '<span class="relatorio-horario">';
          html += '<i data-lucide="log-in" class="info-icon"></i>';
          html += `Entrada: ${formatarHorario(registro.entrada)}`;
          html += '</span>';
        }
        if (registro.saida) {
          html += '<span class="relatorio-horario">';
          html += '<i data-lucide="log-out" class="info-icon"></i>';
          html += `Saída: ${formatarHorario(registro.saida)}`;
          html += '</span>';
        }
        if (horasTrabalhadas) {
          html += '<span class="relatorio-horario relatorio-horario-total">';
          html += '<i data-lucide="clock" class="info-icon"></i>';
          html += `Total: ${horasTrabalhadas}`;
          html += '</span>';
        }
        html += '</div>';
      }
      
      if (registro.servicos && registro.servicos.length > 0) {
        html += '<div class="relatorio-ponto-servicos">';
        html += '<h5>';
        html += '<i data-lucide="wrench" class="info-icon"></i>';
        html += `Serviços Realizados (${registro.servicos.length})`;
        html += '</h5>';
        html += '<div class="relatorio-ponto-servicos-list">';
        
        registro.servicos.forEach(servico => {
          html += '<div class="relatorio-ponto-servico-item">';
          html += `<strong>${servico.atividade || 'Sem atividade'}</strong>`;
          if (servico.percentualAvancado) {
            html += `<span class="relatorio-servico-avancado">${servico.percentualAvancado}</span>`;
          }
          if (servico.observacoes) {
            html += `<p class="relatorio-servico-obs">${servico.observacoes}</p>`;
          }
          html += '</div>';
        });
        
        html += '</div>';
        html += '</div>';
      }
      
      html += '</div>';
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
}

function formatarData(dataStr) {
  if (!dataStr) return 'Data não informada';
  
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

function formatarHorario(horarioStr) {
  if (!horarioStr) return '';
  // Formato esperado: "HH:MM" ou "HH:MM:SS"
  const partes = horarioStr.split(':');
  if (partes.length >= 2) {
    return `${partes[0]}:${partes[1]}`;
  }
  return horarioStr;
}

async function carregarRelatorios() {
  mostrarMensagem('Selecione um relatório acima para visualizar', 'success');
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

function mostrarMensagem(texto, tipo) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = texto;
  messageDiv.className = `message ${tipo}`;
  messageDiv.style.display = 'block';

  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 5000);
}

async function exportarFolhaPontoPDF() {
  if (!relatorioAtual || relatorioAtual.tipo !== 'profissionais') {
    mostrarMensagem('Nenhum relatório de profissionais carregado', 'error');
    return;
  }

  const data = relatorioAtual.data;
  if (!data || !data.profissionais || data.profissionais.length === 0) {
    mostrarMensagem('Não há dados para exportar', 'error');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const profissionalNome = document.getElementById('profissionalFilter').value || 'Todos os Profissionais';
    const periodo = data.periodo;
    const periodoTexto = periodo.dataInicio && periodo.dataFim
      ? `${formatarData(periodo.dataInicio)} a ${formatarData(periodo.dataFim)}`
      : periodo.dataInicio
      ? `A partir de: ${formatarData(periodo.dataInicio)}`
      : periodo.dataFim
      ? `Até: ${formatarData(periodo.dataFim)}`
      : 'Todos os registros';

    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Folha de Ponto', margin, yPos);
    yPos += 10;

    // Informações do período
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${periodoTexto}`, margin, yPos);
    yPos += 7;
    
    if (profissionalNome !== 'Todos os Profissionais') {
      doc.text(`Profissional: ${profissionalNome}`, margin, yPos);
      yPos += 7;
    }

    yPos += 5;

    // Dados dos profissionais
    data.profissionais.forEach((profissional, index) => {
      // Verificar se precisa de nova página
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Nome do profissional
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(profissional.nome, margin, yPos);
      yPos += 7;

      // Detalhes do profissional
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (profissional.funcao) {
        doc.text(`Função: ${profissional.funcao}`, margin, yPos);
        yPos += 6;
      }
      if (profissional.valorDiaria > 0) {
        doc.text(`Valor Diária: R$ ${profissional.valorDiaria.toFixed(2).replace('.', ',')}`, margin, yPos);
        yPos += 6;
      }

      // Totais
      doc.setFont('helvetica', 'bold');
      doc.text(`Dias Trabalhados: ${profissional.totalDias || 0}`, margin, yPos);
      yPos += 6;
      if (profissional.totalHoras > 0) {
        doc.text(`Total de Horas: ${Math.round(profissional.totalHoras)}h`, margin, yPos);
        yPos += 6;
      }

      yPos += 5;

      // Registros de ponto
      if (profissional.registros && profissional.registros.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Registros de Ponto:', margin, yPos);
        yPos += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        profissional.registros.forEach(registro => {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          // Data e obra
          doc.setFont('helvetica', 'bold');
          doc.text(`${formatarData(registro.data)} - ${registro.obra}${registro.local ? ' - ' + registro.local : ''}`, margin, yPos);
          yPos += 5;

          // Horários
          doc.setFont('helvetica', 'normal');
          if (registro.entrada) {
            doc.text(`  Entrada: ${formatarHorario(registro.entrada)}`, margin + 5, yPos);
            yPos += 5;
          }
          if (registro.saida) {
            doc.text(`  Saída: ${formatarHorario(registro.saida)}`, margin + 5, yPos);
            yPos += 5;
          }
          if (registro.horasTrabalhadas) {
            doc.text(`  Total: ${registro.horasTrabalhadas}`, margin + 5, yPos);
            yPos += 5;
          }

          // Serviços
          if (registro.servicos && registro.servicos.length > 0) {
            doc.text(`  Serviços (${registro.servicos.length}):`, margin + 5, yPos);
            yPos += 5;
            registro.servicos.forEach(servico => {
              if (yPos > 250) {
                doc.addPage();
                yPos = 20;
              }
              doc.text(`    - ${servico.atividade || 'Sem atividade'}${servico.percentualAvancado ? ' (' + servico.percentualAvancado + ')' : ''}`, margin + 10, yPos);
              yPos += 5;
            });
          }

          yPos += 3;
        });
      }

      // Espaço entre profissionais
      if (index < data.profissionais.length - 1) {
        yPos += 5;
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
      }
    });

    // Salvar PDF
    const nomeArquivo = `folha_ponto_${profissionalNome !== 'Todos os Profissionais' ? profissionalNome.replace(/\s+/g, '_') : 'todos'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nomeArquivo);
    
    mostrarMensagem('Folha de ponto exportada com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    mostrarMensagem('Erro ao exportar PDF: ' + error.message, 'error');
  }
}

