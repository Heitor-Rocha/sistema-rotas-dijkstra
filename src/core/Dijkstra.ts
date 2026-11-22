import { type Cidade, Grafo } from './Grafo';
import { MinHeap } from './MinHeap';

export interface ResultadoDijkstra {
  existeRota: boolean;
  origem: Cidade;
  destino: Cidade;
  caminho: Cidade[];
  ordemVisitacao: Cidade[];
  distanciaTotal: number;
  logs: string[];
}

export function calcularMenorRota(
  grafo: Grafo,
  origemId: string,
  destinoId: string
): ResultadoDijkstra {
  const origem = grafo.getCidade(origemId);
  const destino = grafo.getCidade(destinoId);

  if (!origem) {
    throw new Error(`Cidade de origem "${origemId}" não existe.`);
  }
  if (!destino) {
    throw new Error(`Cidade de destino "${destinoId}" não existe.`);
  }

  const logs: string[] = [];
  logs.push(`Iniciando busca de menor rota: ${origem.nome} (${origem.id}) → ${destino.nome} (${destino.id})`);

  if (origemId === destinoId) {
    logs.push('Origem e destino são iguais. Distância total: 0 km.');
    return {
      existeRota: true,
      origem,
      destino,
      caminho: [origem],
      ordemVisitacao: [origem],
      distanciaTotal: 0,
      logs,
    };
  }

  const distancias = new Map<string, number>();
  const anteriores = new Map<string, string | null>();
  const visitados = new Set<string>();
  const ordemVisitacao: Cidade[] = [];
  const pq = new MinHeap();

  for (const cidade of grafo.listarCidades()) {
    distancias.set(cidade.id, Infinity);
    anteriores.set(cidade.id, null);
  }

  distancias.set(origemId, 0);
  pq.insert({ cidadeId: origemId, distancia: 0 });

  while (!pq.isEmpty()) {
    const atual = pq.extractMin()!;
    const u = atual.cidadeId;
    const distAtual = atual.distancia;

    if (visitados.has(u)) {
      continue;
    }

    visitados.add(u);
    const cidadeAtual = grafo.getCidade(u)!;
    ordemVisitacao.push(cidadeAtual);
    logs.push(`Visitando vértice: ${cidadeAtual.nome} (distância acumulada: ${distAtual} km)`);

    if (u === destinoId) {
      logs.push(`Destino ${destino.nome} alcançado com custo mínimo!`);
      break;
    }

    for (const aresta of grafo.getVizinhos(u)) {
      const v = aresta.destinoId;
      if (visitados.has(v)) continue;

      const novaDistancia = distAtual + aresta.distancia;
      const distanciaConhecida = distancias.get(v) ?? Infinity;

      if (novaDistancia < distanciaConhecida) {
        distancias.set(v, novaDistancia);
        anteriores.set(v, u);
        pq.insert({ cidadeId: v, distancia: novaDistancia });

        const vizinhoCidade = grafo.getCidade(v)!;
        logs.push(
          `  ↳ Relaxamento: ${cidadeAtual.id} → ${vizinhoCidade.id} (nova menor distância: ${novaDistancia} km)`
        );
      }
    }
  }

  const distanciaFinal = distancias.get(destinoId) ?? Infinity;

  if (distanciaFinal === Infinity) {
    logs.push(`Nenhuma rota encontrada entre ${origem.nome} e ${destino.nome}.`);
    return {
      existeRota: false,
      origem,
      destino,
      caminho: [],
      ordemVisitacao,
      distanciaTotal: Infinity,
      logs,
    };
  }

  const caminho: Cidade[] = [];
  let atualId: string | null = destinoId;

  while (atualId !== null) {
    const cidade = grafo.getCidade(atualId);
    if (cidade) {
      caminho.unshift(cidade);
    }
    atualId = anteriores.get(atualId) ?? null;
  }

  const resumoRota = caminho.map((c) => c.nome).join(' → ');
  logs.push(`Rota mínima: ${resumoRota} | Distância total: ${distanciaFinal} km`);

  return {
    existeRota: true,
    origem,
    destino,
    caminho,
    ordemVisitacao,
    distanciaTotal: distanciaFinal,
    logs,
  };
}