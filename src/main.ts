import './style.css';
import { Grafo } from './core/Grafo';
import { calcularMenorRota } from './core/Dijkstra';
import { carregarCenarioPadrao } from './data/regiaoVicosa';
import { MapManager } from './ui/MapManager';

const STORAGE_KEY = 'rotas_vicosa_grafo_v1';
const grafo = new Grafo();

function salvarEstado(): void {
  localStorage.setItem(STORAGE_KEY, grafo.exportarJSON());
}

const dadosSalvos = localStorage.getItem(STORAGE_KEY);
if (dadosSalvos) {
  try {
    grafo.importarJSON(dadosSalvos);
  } catch {
    carregarCenarioPadrao(grafo);
    salvarEstado();
  }
} else {
  carregarCenarioPadrao(grafo);
  salvarEstado();
}

let rotaAtualIds: string[] = [];

const aguardar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const logTerminal = (mensagem: string) => {
  const terminal = document.getElementById('terminal-logs')!;
  const linha = document.createElement('div');
  const hora = new Date().toLocaleTimeString('pt-BR', { hour12: false });
  linha.textContent = `[${hora}] ${mensagem}`;
  terminal.appendChild(linha);
  terminal.scrollTop = terminal.scrollHeight;
};

const mostrarToast = (mensagem: string, erro = false) => {
  const toast = document.getElementById('toast')!;
  toast.textContent = mensagem;
  toast.className = erro ? 'toast erro' : 'toast';
  setTimeout(() => toast.classList.add('hidden'), 3500);
};

// Inicializa o mapa e preenche lat/lng ao clicar
const mapManager = new MapManager('map', (lat, lng) => {
  (document.getElementById('cidade-lat') as HTMLInputElement).value = String(lat);
  (document.getElementById('cidade-lng') as HTMLInputElement).value = String(lng);
  mostrarToast(`Coordenadas capturadas: ${lat}, ${lng}`);
});

function atualizarInterface(): void {
  const cidades = grafo.listarCidades();
  const estradas = grafo.listarEstradasUnicas();

  // Atualiza contadores
  document.getElementById('count-nos')!.textContent = String(cidades.length);
  document.getElementById('count-arestas')!.textContent = String(estradas.length);

  // Atualiza todos os <select>
  const selects = ['select-origem', 'select-destino', 'estrada-origem', 'estrada-destino'];
  selects.forEach((id, idx) => {
    const el = document.getElementById(id) as HTMLSelectElement;
    const valorAnterior = el.value;
    el.innerHTML = cidades
      .map((c) => `<option value="${c.id}">${c.nome} (${c.id})</option>`)
      .join('');

    if (cidades.some((c) => c.id === valorAnterior)) {
      el.value = valorAnterior;
    } else if (idx % 2 === 1 && cidades.length > 3) {
      el.selectedIndex = 3; // Deixa Ervália pré-selecionada como destino inicial
    }
  });

  // Atualiza lista de cidades (Requisitos 4.3 e 4.7)
  const listaCidades = document.getElementById('lista-cidades')!;
  listaCidades.innerHTML = cidades
    .map(
      (c) => `
      <li>
        <div>
          <strong>${c.nome}</strong> <span class="item-meta">(${c.id})</span>
        </div>
        <button class="btn-del" data-del-cidade="${c.id}" title="Remover cidade e suas estradas">✕</button>
      </li>`
    )
    .join('');

  // Atualiza lista de estradas (Requisitos 4.3 e 4.6)
  const listaEstradas = document.getElementById('lista-estradas')!;
  listaEstradas.innerHTML = estradas
    .map(
      (e) => `
      <li>
        <div>
          <strong>${e.origem.id}</strong> ↔ <strong>${e.destino.id}</strong>
          <span class="item-meta">(${e.distancia} km)</span>
        </div>
        <button class="btn-del" data-del-origem="${e.origem.id}" data-del-destino="${e.destino.id}" title="Remover estrada">✕</button>
      </li>`
    )
    .join('');

  // Redesenha o mapa
  const cidadesDaRota = rotaAtualIds
    .map((id) => grafo.getCidade(id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  mapManager.renderizarGrafo(grafo, cidadesDaRota);
}

// Navegação entre abas
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.getAttribute('data-tab')!;
    document.getElementById(target)!.classList.add('active');
  });
});

// Calcular Menor Rota com Animação da MinHeap (Requisitos 4.4 e 4.5)
document.getElementById('btn-calcular')!.addEventListener('click', async () => {
  const origemId = (document.getElementById('select-origem') as HTMLSelectElement).value;
  const destinoId = (document.getElementById('select-destino') as HTMLSelectElement).value;
  const box = document.getElementById('resultado-card')!;
  const btnCalc = document.getElementById('btn-calcular') as HTMLButtonElement;

  try {
    btnCalc.disabled = true;
    const res = calcularMenorRota(grafo, origemId, destinoId);

    // Animação progressiva dos nós extraídos da MinHeap
    const visitadosAteAgora = [];
    for (const cidade of res.ordemVisitacao) {
      visitadosAteAgora.push(cidade);
      await mapManager.renderizarGrafo(grafo, [], visitadosAteAgora);
      await aguardar(280);
    }

    res.logs.forEach((l) => logTerminal(l));
    box.classList.remove('hidden', 'erro');

    if (!res.existeRota) {
      rotaAtualIds = [];
      box.classList.add('erro');
      box.innerHTML = `
        <strong>Rota Indisponível</strong>
        <p class="hint" style="margin-top:6px;">Não existe conexão rodoviária entre <strong>${res.origem.nome}</strong> e <strong>${res.destino.nome}</strong>.</p>
      `;
    } else {
      rotaAtualIds = res.caminho.map((c) => c.id);
      const trilha = res.caminho.map((c) => `${c.nome} (${c.id})`).join(' → ');
      box.innerHTML = `
        <span class="item-meta">${res.origem.nome} → ${res.destino.nome}</span>
        <div class="resultado-dist">${res.distanciaTotal} km</div>
        <div class="resultado-caminho">${trilha}</div>
      `;
    }

    atualizarInterface();
  } catch (err: any) {
    mostrarToast(err.message, true);
  } finally {
    btnCalc.disabled = false;
  }
});

// Limpar destaque da rota
document.getElementById('btn-limpar-rota')!.addEventListener('click', () => {
  rotaAtualIds = [];
  document.getElementById('resultado-card')!.classList.add('hidden');
  atualizarInterface();
});

// Limpar logs do terminal
document.getElementById('btn-limpar-log')!.addEventListener('click', () => {
  document.getElementById('terminal-logs')!.innerHTML = '';
});

// Cadastrar Cidade (Requisito 4.1)
document.getElementById('form-cidade')!.addEventListener('submit', (e) => {
  e.preventDefault();
  const idInput = document.getElementById('cidade-id') as HTMLInputElement;
  const nomeInput = document.getElementById('cidade-nome') as HTMLInputElement;
  const latInput = document.getElementById('cidade-lat') as HTMLInputElement;
  const lngInput = document.getElementById('cidade-lng') as HTMLInputElement;

  try {
    const id = idInput.value.toUpperCase();
    const nome = nomeInput.value;
    grafo.cadastrarCidade(id, nome, Number(latInput.value), Number(lngInput.value));
    salvarEstado();
    logTerminal(`Cidade cadastrada: ${nome} (${id})`);
    mostrarToast(`Cidade ${nome} cadastrada com sucesso!`);
    idInput.value = '';
    nomeInput.value = '';
    atualizarInterface();
  } catch (err: any) {
    mostrarToast(err.message, true);
  }
});

// Cadastrar Estrada (Requisito 4.2)
document.getElementById('form-estrada')!.addEventListener('submit', (e) => {
  e.preventDefault();
  const origem = (document.getElementById('estrada-origem') as HTMLSelectElement).value;
  const destino = (document.getElementById('estrada-destino') as HTMLSelectElement).value;
  const distInput = document.getElementById('estrada-dist') as HTMLInputElement;

  try {
    const dist = Number(distInput.value);
    grafo.cadastrarEstrada(origem, destino, dist);
    salvarEstado();
    logTerminal(`Estrada cadastrada: ${origem} ↔ ${destino} (${dist} km)`);
    mostrarToast(`Estrada conectada (${dist} km)!`);
    distInput.value = '';
    atualizarInterface();
  } catch (err: any) {
    mostrarToast(err.message, true);
  }
});

// Sugerir distância rodoviária real via OSRM no cadastro de estrada
document.getElementById('btn-sugerir-dist')!.addEventListener('click', async () => {
  const origemId = (document.getElementById('estrada-origem') as HTMLSelectElement).value;
  const destinoId = (document.getElementById('estrada-destino') as HTMLSelectElement).value;
  const distInput = document.getElementById('estrada-dist') as HTMLInputElement;
  const btn = document.getElementById('btn-sugerir-dist') as HTMLButtonElement;

  if (origemId === destinoId) {
    mostrarToast('Selecione duas cidades diferentes.', true);
    return;
  }

  const origem = grafo.getCidade(origemId);
  const destino = grafo.getCidade(destinoId);
  if (!origem || !destino) return;

  const textoOriginal = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Buscando...';

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origem.lng},${origem.lat};${destino.lng},${destino.lat}?overview=false`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Falha na consulta OSRM');

    const data = await resp.json();
    if (data.code === 'Ok' && data.routes?.length > 0) {
      const kmReal = Number((data.routes[0].distance / 1000).toFixed(1));
      distInput.value = String(kmReal);
      mostrarToast(`Distância rodoviária obtida: ${kmReal} km`);
    } else {
      throw new Error('Rota rodoviária não encontrada');
    }
  } catch {
    mostrarToast('Não foi possível obter a distância online. Digite manualmente.', true);
  } finally {
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }
});

// Delegação de eventos para remoção de cidades e estradas (Requisitos 4.6 e 4.7)
document.getElementById('tab-rede')!.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;

  const cidadeId = target.getAttribute('data-del-cidade');
  if (cidadeId) {
    grafo.removerCidade(cidadeId);
    salvarEstado();
    rotaAtualIds = [];
    document.getElementById('resultado-card')!.classList.add('hidden');
    logTerminal(`Cidade removida (e suas conexões): ${cidadeId}`);
    mostrarToast(`Cidade ${cidadeId} removida.`);
    atualizarInterface();
    return;
  }

  const orig = target.getAttribute('data-del-origem');
  const dest = target.getAttribute('data-del-destino');
  if (orig && dest) {
    grafo.removerEstrada(orig, dest);
    salvarEstado();
    rotaAtualIds = [];
    document.getElementById('resultado-card')!.classList.add('hidden');
    logTerminal(`Estrada removida: ${orig} ↔ ${dest}`);
    mostrarToast(`Estrada ${orig} ↔ ${dest} removida.`);
    atualizarInterface();
  }
});

// Restaurar grafo padrão
document.getElementById('btn-resetar-rede')!.addEventListener('click', () => {
  carregarCenarioPadrao(grafo);
  salvarEstado();
  rotaAtualIds = [];
  document.getElementById('resultado-card')!.classList.add('hidden');
  logTerminal('Rede rodoviária restaurada para o cenário padrão de Viçosa.');
  atualizarInterface();
});

// Encerrar e Reiniciar Sistema (Requisito 4.8)
document.getElementById('btn-encerrar')!.addEventListener('click', () => {
  logTerminal('Execução encerrada pelo usuário.');
  document.getElementById('tela-encerrado')!.classList.remove('hidden');
});

document.getElementById('btn-reiniciar')!.addEventListener('click', () => {
  document.getElementById('tela-encerrado')!.classList.add('hidden');
  logTerminal('Sistema reiniciado.');
});

// Inicialização
logTerminal(`Sistema inicializado (${grafo.listarCidades().length} cidades e ${grafo.listarEstradasUnicas().length} estradas).`);
atualizarInterface();