export interface Cidade {
  id: string;
  nome: string;
  lat: number;
  lng: number;
}

export interface Aresta {
  destinoId: string;
  distancia: number; // em km
}

export interface EstradaDetalhada {
  origem: Cidade;
  destino: Cidade;
  distancia: number;
}

export class Grafo {
  private vertices: Map<string, Cidade> = new Map();
  private adjacencias: Map<string, Aresta[]> = new Map();

  // 4.1. Cadastrar cidades
  public cadastrarCidade(id: string, nome: string, lat: number, lng: number): void {
    const idLimpo = id.trim();
    const nomeLimpo = nome.trim();

    if (!idLimpo || !nomeLimpo) {
      throw new Error('ID e nome da cidade são obrigatórios.');
    }
    if (this.vertices.has(idLimpo)) {
      throw new Error(`Já existe uma cidade cadastrada com o ID "${idLimpo}".`);
    }

    const existeNome = Array.from(this.vertices.values()).some(
      (c) => c.nome.toLowerCase() === nomeLimpo.toLowerCase()
    );
    if (existeNome) {
      throw new Error(`Já existe uma cidade cadastrada com o nome "${nomeLimpo}".`);
    }

    this.vertices.set(idLimpo, { id: idLimpo, nome: nomeLimpo, lat, lng });
    this.adjacencias.set(idLimpo, []);
  }

  // 4.2. Cadastrar estradas (bidirecional, sem duplicatas, distância >= 0)
  public cadastrarEstrada(origemId: string, destinoId: string, distancia: number): void {
    if (!this.vertices.has(origemId)) {
      throw new Error(`Cidade de origem "${origemId}" não existe.`);
    }
    if (!this.vertices.has(destinoId)) {
      throw new Error(`Cidade de destino "${destinoId}" não existe.`);
    }
    if (origemId === destinoId) {
      throw new Error('Não é possível cadastrar uma estrada de uma cidade para ela mesma.');
    }
    if (isNaN(distancia) || distancia < 0) {
      throw new Error('A distância da estrada não pode ser negativa.');
    }

    const vizinhosOrigem = this.adjacencias.get(origemId)!;
    const jaExiste = vizinhosOrigem.some((aresta) => aresta.destinoId === destinoId);

    if (jaExiste) {
      throw new Error('Esta estrada já está cadastrada entre as duas cidades.');
    }

    // Grafo não-direcionado: insere nos dois sentidos
    vizinhosOrigem.push({ destinoId, distancia });
    this.adjacencias.get(destinoId)!.push({ destinoId: origemId, distancia });
  }

  // 4.6. Remover uma estrada
  public removerEstrada(origemId: string, destinoId: string): void {
    if (!this.vertices.has(origemId) || !this.vertices.has(destinoId)) {
      throw new Error('Uma ou ambas as cidades informadas não existem.');
    }

    const vizinhosOrigem = this.adjacencias.get(origemId)!;
    const indexOrigem = vizinhosOrigem.findIndex((a) => a.destinoId === destinoId);

    if (indexOrigem === -1) {
      throw new Error('Não existe estrada cadastrada entre essas duas cidades.');
    }

    vizinhosOrigem.splice(indexOrigem, 1);

    const vizinhosDestino = this.adjacencias.get(destinoId)!;
    const indexDestino = vizinhosDestino.findIndex((a) => a.destinoId === origemId);
    if (indexDestino !== -1) {
      vizinhosDestino.splice(indexDestino, 1);
    }
  }

  // 4.7. Remover uma cidade e todas as estradas conectadas a ela
  public removerCidade(cidadeId: string): void {
    if (!this.vertices.has(cidadeId)) {
      throw new Error(`Cidade "${cidadeId}" não encontrada.`);
    }

    // Remove referências a essa cidade nas listas de adjacência dos vizinhos
    for (const [outroId, vizinhos] of this.adjacencias.entries()) {
      if (outroId !== cidadeId) {
        this.adjacencias.set(
          outroId,
          vizinhos.filter((aresta) => aresta.destinoId !== cidadeId)
        );
      }
    }

    this.adjacencias.delete(cidadeId);
    this.vertices.delete(cidadeId);
  }

  // 4.3. Consultas e listagens
  public getCidade(id: string): Cidade | undefined {
    return this.vertices.get(id);
  }

  public listarCidades(): Cidade[] {
    return Array.from(this.vertices.values());
  }

  public getVizinhos(cidadeId: string): Aresta[] {
    return this.adjacencias.get(cidadeId) || [];
  }

  public listarEstradasUnicas(): EstradaDetalhada[] {
    const estradas: EstradaDetalhada[] = [];
    const visitadas = new Set<string>();

    for (const [origemId, vizinhos] of this.adjacencias.entries()) {
      const origem = this.vertices.get(origemId)!;
      for (const aresta of vizinhos) {
        const chavePar = [origemId, aresta.destinoId].sort().join('--');
        if (!visitadas.has(chavePar)) {
          visitadas.add(chavePar);
          const destino = this.vertices.get(aresta.destinoId)!;
          estradas.push({ origem, destino, distancia: aresta.distancia });
        }
      }
    }

    return estradas;
  }

  public limpar(): void {
    this.vertices.clear();
    this.adjacencias.clear();
    
  }
  public exportarJSON(): string {
    const dados = {
      cidades: this.listarCidades(),
      estradas: this.listarEstradasUnicas().map((e) => ({
        origemId: e.origem.id,
        destinoId: e.destino.id,
        distancia: e.distancia,
      })),
    };
    return JSON.stringify(dados);
  }

  public importarJSON(json: string): void {
    const dados = JSON.parse(json);
    this.limpar();

    for (const c of dados.cidades) {
      this.cadastrarCidade(c.id, c.nome, c.lat, c.lng);
    }
    for (const e of dados.estradas) {
      this.cadastrarEstrada(e.origemId, e.destinoId, e.distancia);
    }
  }

}