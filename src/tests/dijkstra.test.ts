import { describe, it, expect, beforeEach } from 'vitest';
import { Grafo } from '../core/Grafo';
import { calcularMenorRota } from '../core/Dijkstra';
import { carregarCenarioPadrao } from '../data/regiaoVicosa';

describe('Testes Obrigatórios - Sistema de Cálculo de Rotas (INF104)', () => {
  let grafo: Grafo;

  beforeEach(() => {
    grafo = new Grafo();
    carregarCenarioPadrao(grafo);
  });

  it('Teste 1: Origem e destino iguais deve retornar distância zero', () => {
    const res = calcularMenorRota(grafo, 'VIC', 'VIC');
    expect(res.existeRota).toBe(true);
    expect(res.distanciaTotal).toBe(0);
    expect(res.caminho.map((c) => c.id)).toEqual(['VIC']);
  });

  it('Teste 2: Existe estrada direta e ela é a menor rota (Viçosa -> Teixeiras)', () => {
    const res = calcularMenorRota(grafo, 'VIC', 'TEI');
    expect(res.existeRota).toBe(true);
    expect(res.distanciaTotal).toBe(14);
    expect(res.caminho.map((c) => c.id)).toEqual(['VIC', 'TEI']);
  });

  it('Teste 3: Menor rota passa por cidades intermediárias mesmo havendo ligação direta', () => {
    // Direta VIC -> ERV = 65 km | Via Coimbra = 20 + 30 = 50 km
    const res = calcularMenorRota(grafo, 'VIC', 'ERV');
    expect(res.existeRota).toBe(true);
    expect(res.distanciaTotal).toBe(50);
    expect(res.caminho.length).toBe(3);
  });

  it('Teste 4: Duas rotas possuem a mesma distância mínima (50 km) e retorna uma delas', () => {
    // Rota A: VIC -> COI -> ERV (50 km) | Rota B: VIC -> CAJ -> ERV (50 km)
    const res = calcularMenorRota(grafo, 'VIC', 'ERV');
    const rotaIds = res.caminho.map((c) => c.id);
    const ehRotaA = JSON.stringify(rotaIds) === JSON.stringify(['VIC', 'COI', 'ERV']);
    const ehRotaB = JSON.stringify(rotaIds) === JSON.stringify(['VIC', 'CAJ', 'ERV']);

    expect(res.distanciaTotal).toBe(50);
    expect(ehRotaA || ehRotaB).toBe(true);
  });

  it('Teste 5: Não existe conexão entre origem e destino (Pedra do Anta isolada)', () => {
    const res = calcularMenorRota(grafo, 'VIC', 'PDA');
    expect(res.existeRota).toBe(false);
    expect(res.caminho).toEqual([]);
  });

  it('Teste 6: Uma estrada é removida e o algoritmo recalcula considerando o grafo atualizado', () => {
    // Removendo Coimbra <-> Ervália e Cajuri <-> Ervália, sobra apenas a direta de 65 km
    grafo.removerEstrada('COI', 'ERV');
    grafo.removerEstrada('CAJ', 'ERV');

    const res = calcularMenorRota(grafo, 'VIC', 'ERV');
    expect(res.existeRota).toBe(true);
    expect(res.distanciaTotal).toBe(65);
    expect(res.caminho.map((c) => c.id)).toEqual(['VIC', 'ERV']);
  });

  it('Teste 7: Uma cidade é removida, eliminando suas conexões e atualizando consultas', () => {
    // Removendo Teixeiras, a rota VIC -> PFI deixa de ir por Teixeiras (46 km) e vai por Paula Cândido (50 km)
    grafo.removerCidade('TEI');

    expect(grafo.getCidade('TEI')).toBeUndefined();
    const res = calcularMenorRota(grafo, 'VIC', 'PFI');
    expect(res.existeRota).toBe(true);
    expect(res.distanciaTotal).toBe(50);
    expect(res.caminho.map((c) => c.id)).toEqual(['VIC', 'PLC', 'PFI']);
  });

  it('Teste 8: Cidade informada não existe deve lançar erro adequado', () => {
    expect(() => calcularMenorRota(grafo, 'VIC', 'INEXISTENTE')).toThrow(
      'Cidade de destino "INEXISTENTE" não existe.'
    );
  });

  it('Teste 9: Distância informada é negativa deve rejeitar o cadastro', () => {
    expect(() => grafo.cadastrarEstrada('VIC', 'PDA', -10)).toThrow(
      'A distância da estrada não pode ser negativa.'
    );
  });

  it('Teste 10: Estrada cadastrada novamente deve impedir duplicação (mesmo em sentido inverso)', () => {
    expect(() => grafo.cadastrarEstrada('COI', 'VIC', 20)).toThrow(
      'Esta estrada já está cadastrada entre as duas cidades.'
    );
  });
});