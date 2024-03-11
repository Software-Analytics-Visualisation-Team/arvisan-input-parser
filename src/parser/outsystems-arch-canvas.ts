import {
  CoreLayerSublayers,
  DependencyType,
  EndUserLayerSublayers,
  FoundationLayerSublayers,
  ModuleLayers,
  ModuleSublayer,
} from '../structure';

export interface ConsumerProducerEntry {
  'Cons Application': string // Consumer application
  'Cons Espace': string // Consumer module
  'Prod Application': string // Consumer application
  'Prod Espace': string // Consumer module
  'Reference Name': string
  'Reference Kind': string
  'Reference SS Key': string
}

export interface ApplicationGroupEntry {
  ApplicationGroupName: string;
  ApplicationName: string;
  ModuleKind: string;
  ModuleName: string;
}

export interface IntegrationServiceAPIEntry {
  ApplicationName: string,
  ModuleName: string,
  EndpointAndMethod: string,
  direction: 'REST (Consume)' | 'REST (Expose)' | string,
  logtype: 'Integration' | 'ServiceAPI',
  count: number,
}

/**
 * Mapping from reference kind to edge labels
 * @param kind
 */
export function consumerTypeToDependencyType(kind: string): DependencyType {
  switch (kind) {
    case 'Action': return DependencyType.STRONG;
    case 'Entity': return DependencyType.ENTITY;
    case 'Structure': return DependencyType.STRONG;
    case 'ClientAction': return DependencyType.STRONG;
    case 'WebBlock': return DependencyType.STRONG;
    case 'StaticEntity': return DependencyType.ENTITY;
    case 'Image': return DependencyType.STRONG;
    case 'Script': return DependencyType.STRONG;
    case 'Theme': return DependencyType.STRONG;
    case 'Role': return DependencyType.STRONG;
    case 'WebScreen': return DependencyType.STRONG;
    case 'Resource': return DependencyType.STRONG;
    case 'ClientEntity': return DependencyType.ENTITY;
    case 'FlowExceptionHandlingFlow': return DependencyType.STRONG;
    case 'ServiceAPIMethod': return DependencyType.WEAK;
    case 'Process': return DependencyType.STRONG;

    case 'Integration': return DependencyType.WEAK; // Does not exist in OutSystems consumer-producer datasets,
      // but is included here for completeness’s sake. The integration dataset should be provided
      // separately and is parsed by the IntegrationParser.

    default: throw new Error(`Unknown consumer type: ${kind}`);
  }
}

/**
 * Given the name of a module, extract the type of module based on its extension
 * If no explicit defined extension, the module will be of layer Enduser
 * @param moduleName
 */
export function moduleSuffixToLayers(moduleName: string): {
  layer: ModuleLayers, sublayer: ModuleSublayer,
} {
  const suffix = moduleName.split('_').pop()?.toLowerCase();
  switch (suffix) {
    case 'api':
      return { layer: ModuleLayers.CORE, sublayer: CoreLayerSublayers.API };
    case 'cw':
      return { layer: ModuleLayers.CORE, sublayer: CoreLayerSublayers.CORE_WIDGETS };
    case 'cs':
      return { layer: ModuleLayers.CORE, sublayer: CoreLayerSublayers.CORE_SERVICE };
    case 'bl':
      return { layer: ModuleLayers.CORE, sublayer: CoreLayerSublayers.COMPOSITE_LOGIC };
    case 'theme':
    case 'thm':
    case 'th':
      return { layer: ModuleLayers.FOUNDATION, sublayer: FoundationLayerSublayers.STYLE_GUIDE };
    case 'is':
      return {
        layer: ModuleLayers.FOUNDATION,
        sublayer: FoundationLayerSublayers.FOUNDATION_SERVICE,
      };
    case 'lib':
      return { layer: ModuleLayers.FOUNDATION, sublayer: FoundationLayerSublayers.LIBRARY };
    default: break;
  }

  const prefix = moduleName.split('_').shift()?.toLowerCase();
  switch (prefix) {
    case 'cdm':
      return { layer: ModuleLayers.FOUNDATION, sublayer: FoundationLayerSublayers.LIBRARY };
    default: break;
  }

  return { layer: ModuleLayers.END_USER, sublayer: EndUserLayerSublayers.END_USER };
}
