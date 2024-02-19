export enum ModuleLayers {
  END_USER = 'Enduser',
  CORE = 'Core',
  FOUNDATION = 'Foundation',
}

export enum EndUserLayerSublayers {
  END_USER = 'Enduser',
}

export enum CoreLayerSublayers {
  CORE = 'Core',
  API = 'API',
  CORE_WIDGETS = 'CoreWidgets',
  COMPOSITE_LOGIC = 'CompositeLogic',
  CORE_SERVICE = 'CoreService',
}

export enum FoundationLayerSublayers {
  FOUNDATION = 'Foundation',
  STYLE_GUIDE = 'StyleGuide',
  FOUNDATION_SERVICE = 'FoundationService',
  LIBRARY = 'Library',
}

export const moduleColors = {
  [ModuleLayers.END_USER]: '#3498DB',
  [ModuleLayers.CORE]: '#E67E22',
  [ModuleLayers.FOUNDATION]: '#28B463',
};

export type ModuleSublayer = EndUserLayerSublayers | CoreLayerSublayers | FoundationLayerSublayers;

export interface Node {
  data: {
    id: string;
    properties: {
      simpleName: string;
      kind: string;
      traces: string[];
      color: string;
      depth: number;
    }
    labels: string[];
  }
}

export interface Edge {
  data: {
    id: string;
    source: string;
    target: string;
    label: string;
    properties: {
      weight: number;
      traces: string[];
    }
  }
}

export interface Graph {
  elements: {
    nodes: Node[];
    edges: Edge[];
  }
}

export function formatName(id: string) {
  return id
    .replaceAll(' ', '_')
    .replaceAll('-', '__')
    .replaceAll('&', 'and')
    .replaceAll('/', '')
    .replaceAll('+', 'plus')
    .replaceAll('(', '')
    .replaceAll(')', '')
    .replaceAll('.', '');
}
