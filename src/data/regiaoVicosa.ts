import { Grafo } from '../core/Grafo';

export function carregarCenarioPadrao(grafo: Grafo): void {
  grafo.limpar();

  // 1. Cadastro das 8 cidades sugeridas + 1 cidade isolada (total: 9 vértices)
  grafo.cadastrarCidade('VIC', 'Viçosa', -20.7546, -42.8825);
  grafo.cadastrarCidade('COI', 'Coimbra', -20.8583, -42.8017);
  grafo.cadastrarCidade('TEI', 'Teixeiras', -20.6525, -42.8558);
  grafo.cadastrarCidade('ERV', 'Ervália', -20.8386, -42.6569);
  grafo.cadastrarCidade('CAJ', 'Cajuri', -20.7908, -42.7964);
  grafo.cadastrarCidade('PLC', 'Paula Cândido', -20.8733, -42.9803);
  grafo.cadastrarCidade('SMA', 'São Miguel do Anta', -20.7061, -42.7186);
  grafo.cadastrarCidade('PFI', 'Porto Firme', -20.6731, -43.0844);
  grafo.cadastrarCidade('PDA', 'Pedra do Anta', -20.6011, -42.7289); // Ilhada (sem estradas)[cite: 2]

  // 2. Cadastro de 12 estradas ponderadas (em km)[cite: 2]
  grafo.cadastrarEstrada('VIC', 'COI', 20);
  grafo.cadastrarEstrada('COI', 'ERV', 30);
  grafo.cadastrarEstrada('VIC', 'ERV', 65); // Direta mais longa que via Coimbra (20 + 30 = 50 km)[cite: 2]
  grafo.cadastrarEstrada('VIC', 'CAJ', 15);
  grafo.cadastrarEstrada('CAJ', 'COI', 18);
  grafo.cadastrarEstrada('CAJ', 'ERV', 35); // Empate: VIC->COI->ERV (50 km) vs VIC->CAJ->ERV (15+35 = 50 km)[cite: 2]
  grafo.cadastrarEstrada('VIC', 'TEI', 14);
  grafo.cadastrarEstrada('TEI', 'PFI', 32);
  grafo.cadastrarEstrada('VIC', 'PLC', 22);
  grafo.cadastrarEstrada('PLC', 'PFI', 28);
  grafo.cadastrarEstrada('VIC', 'SMA', 25);
  grafo.cadastrarEstrada('SMA', 'TEI', 21);
}