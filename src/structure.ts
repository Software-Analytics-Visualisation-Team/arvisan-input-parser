export enum GraphLayers {
  DOMAIN = 'Domain',
  APPLICATION = 'Application',
  LAYER = 'Layer',
  SUB_LAYER = 'Sublayer',
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

export enum ModuleDependencyProfileCategory {
  HIDDEN = 'hidden',
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  TRANSIT = 'transit',
  NONE = '',
}

export type NodePropertiesDetails = {
  // Module details
  fileSizeKB?: number;
  nrScreens?: number;
  nrEntities?: number;
  nrPublicElements?: number;
  nrRESTConsumers?: number;
  nrRESTProducers?: number;
};

export type NodeProperties = NodePropertiesDetails & {
  // General properties
  fullName: string;
  simpleName: string;
  color: string;
  depth: number;

  // Metrics
  dependencyProfileCategory: ModuleDependencyProfileCategory;
  cohesion?: number;
};

export const optionalModuleProperties: (keyof NodePropertiesDetails)[] = [
  'fileSizeKB', 'nrScreens', 'nrEntities', 'nrPublicElements', 'nrRESTConsumers', 'nrRESTProducers',
];

export interface Node {
  data: {
    id: string;
    properties: NodeProperties,
    labels: (string | GraphLayers)[];
  }
}

export enum RelationshipLabel {
  CONTAINS = 'contains',
  CALLS = 'calls',
  VIOLATES = 'violates',
}

export enum DependencyType {
  COMPILE_TIME = 'compile_time',
  RUNTIME = 'runtime',
  ENTITY = 'entity',
}

export interface EdgeProperties {
  references: Map<string, string[]>; // mapping from type to names that are of that type
  dependencyTypes?: DependencyType[];
  nrDependencies?: number;
  nrCalls?: number;
}

export interface Edge {
  data: {
    id: string;
    source: string;
    target: string;
    label: RelationshipLabel;
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
