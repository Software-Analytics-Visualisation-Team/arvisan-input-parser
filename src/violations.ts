import {
  CoreLayerSublayers, Edge,
  EndUserLayerSublayers,
  formatName, FoundationLayerSublayers,
  Graph,
  moduleColors,
  ModuleLayers,
  Node,
} from './structure';

function getName(sublayer: string) {
  return formatName(`Sublayer-${sublayer}`);
}

function createSublayerNodes(layer: ModuleLayers, sublayers: string[]): Node[] {
  return sublayers.map((sublayer): Node => ({
    data: {
      id: getName(sublayer),
      labels: [getName(sublayer)],
      properties: {
        simpleName: getName(sublayer),
        kind: 'node',
        traces: [],
        color: moduleColors[layer],
        depth: -1,
      },
    },
  }));
}

function createLayerViolationEdges(sublayersFrom: string[], sublayersTo: string[]): Edge[] {
  return sublayersFrom.map((from) => sublayersTo.map((to): Edge => ({
    data: {
      id: `${getName(from)}-${getName(to)}`,
      label: 'violates',
      source: getName(from),
      target: getName(to),
      properties: {
        weight: 1,
        traces: [],
      },
    },
  }))).flat();
}

export function getViolationsAsGraph(): Graph {
  const endUserSublayers = Object.values(EndUserLayerSublayers);
  const coreSublayers = Object.values(CoreLayerSublayers);
  const foundationSublayers = Object.values(FoundationLayerSublayers);

  const nodes = [
    ...createSublayerNodes(ModuleLayers.END_USER, endUserSublayers),
    ...createSublayerNodes(ModuleLayers.CORE, coreSublayers),
    ...createSublayerNodes(ModuleLayers.FOUNDATION, foundationSublayers),
  ];

  const edges = [
    ...createLayerViolationEdges(endUserSublayers, coreSublayers),
    ...createLayerViolationEdges(endUserSublayers, foundationSublayers),
    ...createLayerViolationEdges(coreSublayers, foundationSublayers),
  ];

  return { elements: { nodes, edges } };
}
