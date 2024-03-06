export enum GraphLayers {
  DOMAIN = 'Domain',
  APPLICATION = 'Application',
  LAYER = 'Layer',
  SUB_LAYER = 'SubLayer',
  MODULE = 'Module',
}

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

export type NodeProperties = {
  fullName: string;
  simpleName: string;
  color: string;
  depth: number;
};

export interface Node {
  data: {
    id: string;
    properties: NodeProperties,
    labels: string[];
  }
}

export enum DependencyType {
  STRONG = 'strong',
  WEAK = 'weak',
  ENTITY = 'entity',
}

export interface EdgeProperties {
  referenceType: string;
  dependencyType?: DependencyType;
  weight?: number;
}

export interface Edge {
  data: {
    id: string;
    source: string;
    target: string;
    label: string;
    properties: EdgeProperties
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
    .replaceAll('-', '_')
    .replaceAll('&', 'and')
    .replaceAll('/', '')
    .replaceAll('+', 'plus')
    .replaceAll('(', '')
    .replaceAll(')', '')
    .replaceAll('.', '');
}
