import { DependencyType, ModuleLayers, ModuleSublayer } from '../structure';
/**
 * Mapping from reference kind to edge labels.
 * From https://success.outsystems.com/documentation/11/building_apps/reusing_and_refactoring/understand_strong_and_weak_dependencies/
 * @param kind
 */
export declare function consumerTypeToDependencyType(kind: string): DependencyType;
/**
 * Given the name of a module, extract the type of module based on its extension
 * If no explicit defined extension, the module will be of layer Enduser
 * @param moduleName
 */
export declare function moduleSuffixToLayers(moduleName: string): {
    layer: ModuleLayers;
    sublayer: ModuleSublayer;
};
