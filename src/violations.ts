import {
  CoreLayerSublayers,
  Edge,
  EndUserLayerSublayers,
  FoundationLayerSublayers,
  Graph,
  moduleColors,
  ModuleDependencyProfileCategory,
  ModuleLayers,
  Node,
  RelationshipLabel,
} from './structure';

function getName(sublayer: string) {
  return `Sublayer_${sublayer}`;
}

function createSublayerNodes(layer: ModuleLayers, sublayers: string[]): Node[] {
  return sublayers.map((sublayer): Node => ({
    data: {
      id: getName(sublayer),
      labels: [getName(sublayer)],
      properties: {
        fullName: getName(sublayer),
        simpleName: getName(sublayer),
        color: moduleColors[layer],
        depth: -1,
        dependencyProfileCategory: ModuleDependencyProfileCategory.NONE,
      },
    },
  }));
}

function createLayerViolationEdges(sublayersFrom: string[], sublayersTo: string[]): Edge[] {
  return sublayersFrom.map((from) => sublayersTo.map((to): Edge => ({
    data: {
      id: `${getName(from)}-${getName(to)}`,
      label: RelationshipLabel.VIOLATES,
      source: getName(from),
      target: getName(to),
      properties: {
        referenceType: 'Violates',
        referenceNames: [],
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
    ...createLayerViolationEdges(coreSublayers, endUserSublayers),
    ...createLayerViolationEdges(foundationSublayers, endUserSublayers),
    ...createLayerViolationEdges(foundationSublayers, coreSublayers),
  ];

  return { elements: { nodes, edges } };
}
