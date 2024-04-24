import {
  CoreLayerSublayers,
  DependencyType,
  EndUserLayerSublayers,
  FoundationLayerSublayers,
  ModuleLayers,
  ModuleSublayer,
} from '../structure';

/**
 * Mapping from reference kind to edge labels.
 * From https://success.outsystems.com/documentation/11/building_apps/reusing_and_refactoring/understand_strong_and_weak_dependencies/
 * @param kind
 */
export function consumerTypeToDependencyType(kind: string): DependencyType {
  switch (kind) {
    case 'Action': return DependencyType.COMPILE_TIME;
    case 'Entity': return DependencyType.ENTITY;
    case 'Structure': return DependencyType.RUNTIME;
    case 'ClientAction': return DependencyType.COMPILE_TIME;
    case 'WebBlock': return DependencyType.COMPILE_TIME;
    case 'StaticEntity': return DependencyType.ENTITY;
    case 'Image': return DependencyType.COMPILE_TIME;
    case 'Script': return DependencyType.COMPILE_TIME;
    case 'Theme': return DependencyType.COMPILE_TIME;
    case 'Role': return DependencyType.COMPILE_TIME;
    case 'WebScreen': return DependencyType.RUNTIME;
    case 'Resource': return DependencyType.COMPILE_TIME;
    case 'ClientEntity': return DependencyType.ENTITY;
    case 'FlowExceptionHandlingFlow': return DependencyType.COMPILE_TIME;
    case 'ServiceAPIMethod': return DependencyType.RUNTIME;
    case 'Process': return DependencyType.COMPILE_TIME;

    case 'Integration': return DependencyType.RUNTIME; // Does not exist in OutSystems consumer-producer datasets,
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
    case 'sa':
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
    case 'drv':
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
