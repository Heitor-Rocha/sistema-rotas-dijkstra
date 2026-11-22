# 🗺️ Roteirizador Logístico • Região de Viçosa (Dijkstra & Grafos)

Sistema interativo de cálculo de rotas mínimas modelado sobre a malha rodoviária da Zona da Mata Mineira (região de Viçosa-MG). O projeto implementa do zero as estruturas de dados fundamentais (**Grafo Ponderado via Lista de Adjacência**, **Fila de Prioridade `MinHeap`** e **Algoritmo de Dijkstra**), desacopladas de uma interface cartográfica interativa com visualização passo a passo.

---

## ✨ Funcionalidades Principais

- **Cálculo de Caminho Mínimo (Dijkstra + MinHeap):** Encontra a rota de menor custo acumulado entre quaisquer duas cidades conectadas, exibindo o log detalhado de relaxamento de arestas e animando a ordem de exploração dos vértices e estradas no mapa.
- **Geometria Rodoviária Real (OSRM + OpenStreetMap):** As arestas acompanham o traçado real das rodovias (BR-120, BR-356, MGC-482) via API pública do OSRM, com cache em memória e fallback automático para segmentos retos em modo offline.
- **Gestão Dinâmica da Rede:** Cadastro de novas cidades (com captura de coordenadas pelo clique no mapa), criação de estradas bidirecionais (com opção de consulta automática de distância rodoviária real), e remoção dinâmica de vértices e arestas.
- **Persistência Local:** Sincronização automática do estado do grafo em JSON via `localStorage`, permitindo manter cenários customizados entre sessões.
- **Suíte de Testes Automatizados:** Cobertura completa de cenários de borda (empate de caminhos, vértices isolados, recálculo após remoção e validação de entradas).

---

## 🏗️ Arquitetura e Estruturas de Dados

O sistema segue uma separação estrita entre o núcleo algorítmico (`src/core`) e a camada de apresentação (`src/ui`):

```text
src/
├── core/
│   ├── Grafo.ts         # Grafo simples, ponderado e não-direcionado (Lista de Adjacência)
│   ├── MinHeap.ts       # Fila de prioridade binária implementada manualmente
│   └── Dijkstra.ts      # Algoritmo de caminho mínimo com rastreamento de exploração
├── data/
│   └── regiaoVicosa.ts  # Dataset inicial (9 municípios e 12 rodovias da região)
├── ui/
│   └── MapManager.ts    # Renderização Leaflet, tiles escuros e integração OSRM
├── tests/
│   └── dijkstra.test.ts # 10 testes unitários e de integração (Vitest)
└── main.ts            # Orquestração de eventos, animação e persistência localStorage
```

### Análise de Complexidade Assintótica

| Estrutura / Algoritmo | Complexidade de Tempo | Complexidade de Espaço | Justificativa Técnica |
| :--- | :--- | :--- | :--- |
| **Grafo (Lista de Adjacência)** | $O(1)$ inserção / $O(\text{grau}(v))$ busca | $O(V + E)$ | Ideal para malhas rodoviárias esparsas, evitando o custo quadrático $O(V^2)$ de matrizes. |
| **MinHeap (`insert` / `extractMin`)** | $O(\log V)$ | $O(V)$ | Árvore binária completa em array usando `bubbleUp` e `sinkDown`. |
| **Algoritmo de Dijkstra** | $O((V + E) \log V)$ | $O(V + E)$ | Cada vértice é extraído no máximo uma vez e cada relaxamento insere na fila em $O(\log V)$. |

---

## 🚀 Como Executar Localmente

```bash
# 1. Instale as dependências
npm install

# 2. Inicie o servidor de desenvolvimento
npm run dev

# 3. Execute a suíte de testes automatizados
npx vitest run
```