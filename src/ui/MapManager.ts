import L from 'leaflet';
import { type Cidade, Grafo } from '../core/Grafo';

export class MapManager {
  private map: L.Map;
  private camadaEstradas: L.LayerGroup;
  private camadaCidades: L.LayerGroup;
  private cacheGeometria: Map<string, L.LatLngExpression[]> = new Map();
  private renderToken = 0;

  constructor(containerId: string, onMapClick: (lat: number, lng: number) => void) {
    // Centralizado na região de Viçosa - MG
    this.map = L.map(containerId).setView([-20.76, -42.86], 11);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
      className: 'mapa-tiles-escuros',
    }).addTo(this.map);

    this.camadaEstradas = L.layerGroup().addTo(this.map);
    this.camadaCidades = L.layerGroup().addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
    });
  }

  private async obterTrajetoReal(origem: Cidade, destino: Cidade): Promise<L.LatLngExpression[]> {
    const chave = [origem.id, destino.id].sort().join('--');
    if (this.cacheGeometria.has(chave)) {
      return this.cacheGeometria.get(chave)!;
    }

    const retaFallback: L.LatLngExpression[] = [
      [origem.lat, origem.lng],
      [destino.lat, destino.lng],
    ];

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origem.lng},${origem.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Falha OSRM');

      const data = await resp.json();
      if (data.code === 'Ok' && data.routes?.length > 0) {
        const coords: L.LatLngExpression[] = data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        this.cacheGeometria.set(chave, coords);
        return coords;
      }
    } catch {
      // Sem internet ou falha na API: mantém a linha reta como fallback seguro
    }

    this.cacheGeometria.set(chave, retaFallback);
    return retaFallback;
  }

  public async renderizarGrafo(
    grafo: Grafo,
    rotaDestaque: Cidade[] = [],
    explorados: Cidade[] = []
  ): Promise<void> {
    const tokenAtual = ++this.renderToken;

    const estradas = grafo.listarEstradasUnicas();
    const cidades = grafo.listarCidades();

    const trajetos = await Promise.all(
      estradas.map((e) => this.obterTrajetoReal(e.origem, e.destino))
    );

    if (tokenAtual !== this.renderToken) return;

    this.camadaEstradas.clearLayers();
    this.camadaCidades.clearLayers();

    const idsNaRota = new Set(rotaDestaque.map((c) => c.id));
    const idsExplorados = new Set(explorados.map((c) => c.id));
    const paresNaRota = new Set<string>();

    for (let i = 0; i < rotaDestaque.length - 1; i++) {
      const par = [rotaDestaque[i].id, rotaDestaque[i + 1].id].sort().join('--');
      paresNaRota.add(par);
    }

    // 1. Desenha todas as estradas seguindo o traçado da rodovia
    estradas.forEach((estrada, idx) => {
      const chavePar = [estrada.origem.id, estrada.destino.id].sort().join('--');
      const ehRota = paresNaRota.has(chavePar);
      const coords = trajetos[idx];

      const linha = L.polyline(coords, {
        color: ehRota ? '#10b981' : '#64748b',
        weight: ehRota ? 5 : 2.5,
        opacity: ehRota ? 0.95 : 0.7,
        dashArray: ehRota ? undefined : '6, 6',
      });

      linha.addTo(this.camadaEstradas);

      const pontoMeio = coords[Math.floor(coords.length / 2)];

      const iconePeso = L.divIcon({
        className: '',
        html: `<span class="peso-label ${ehRota ? 'destaque' : ''}">${estrada.distancia} km</span>`,
        iconSize: [48, 20],
        iconAnchor: [24, 10],
      });

      L.marker(pontoMeio, { icon: iconePeso, interactive: false }).addTo(this.camadaEstradas);
    });

    // 2. Desenha todas as cidades (vértices) por cima das linhas
    for (const cidade of cidades) {
      const ehRota = idsNaRota.has(cidade.id);
      const ehExplorado = !ehRota && idsExplorados.has(cidade.id);

      const corPreenchimento = ehRota ? '#10b981' : ehExplorado ? '#f59e0b' : '#38bdf8';

      const marcador = L.circleMarker([cidade.lat, cidade.lng], {
        radius: ehRota || ehExplorado ? 9 : 7,
        fillColor: corPreenchimento,
        color: '#0f172a',
        weight: 2,
        fillOpacity: 1,
      });

      marcador.bindTooltip(
        `<span style="opacity:0.75;font-weight:700">${cidade.id}</span> • ${cidade.nome}`,
        {
          permanent: true,
          direction: 'top',
          offset: [0, -7],
          className: `cidade-tooltip ${ehRota ? 'destaque' : ''}`,
        }
      );

      marcador.addTo(this.camadaCidades);
    }
  }
}