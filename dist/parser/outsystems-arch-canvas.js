"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleSuffixToLayers = exports.consumerTypeToDependencyType = void 0;
const structure_1 = require("../structure");
/**
 * Mapping from reference kind to edge labels.
 * From https://success.outsystems.com/documentation/11/building_apps/reusing_and_refactoring/understand_strong_and_weak_dependencies/
 * @param kind
 */
function consumerTypeToDependencyType(kind) {
    switch (kind) {
        case 'Action': return structure_1.DependencyType.COMPILE_TIME;
        case 'Entity': return structure_1.DependencyType.ENTITY;
        case 'Structure': return structure_1.DependencyType.RUNTIME;
        case 'ClientAction': return structure_1.DependencyType.COMPILE_TIME;
        case 'WebBlock': return structure_1.DependencyType.COMPILE_TIME;
        case 'StaticEntity': return structure_1.DependencyType.ENTITY;
        case 'Image': return structure_1.DependencyType.COMPILE_TIME;
        case 'Script': return structure_1.DependencyType.COMPILE_TIME;
        case 'Theme': return structure_1.DependencyType.COMPILE_TIME;
        case 'Role': return structure_1.DependencyType.COMPILE_TIME;
        case 'WebScreen': return structure_1.DependencyType.RUNTIME;
        case 'Resource': return structure_1.DependencyType.COMPILE_TIME;
        case 'ClientEntity': return structure_1.DependencyType.ENTITY;
        case 'FlowExceptionHandlingFlow': return structure_1.DependencyType.COMPILE_TIME;
        case 'ServiceAPIMethod': return structure_1.DependencyType.RUNTIME;
        case 'Process': return structure_1.DependencyType.COMPILE_TIME;
        case 'Integration': return structure_1.DependencyType.RUNTIME; // Does not exist in OutSystems consumer-producer datasets,
        // but is included here for completeness’s sake. The integration dataset should be provided
        // separately and is parsed by the IntegrationParser.
        default: throw new Error(`Unknown consumer type: ${kind}`);
    }
}
exports.consumerTypeToDependencyType = consumerTypeToDependencyType;
/**
 * Given the name of a module, extract the type of module based on its extension
 * If no explicit defined extension, the module will be of layer Enduser
 * @param moduleName
 */
function moduleSuffixToLayers(moduleName) {
    const suffix = moduleName.split('_').pop()?.toLowerCase();
    switch (suffix) {
        case 'api':
            return { layer: structure_1.ModuleLayers.CORE, sublayer: structure_1.CoreLayerSublayers.API };
        case 'cw':
            return { layer: structure_1.ModuleLayers.CORE, sublayer: structure_1.CoreLayerSublayers.CORE_WIDGETS };
        case 'cs':
            return { layer: structure_1.ModuleLayers.CORE, sublayer: structure_1.CoreLayerSublayers.CORE_SERVICE };
        case 'bl':
        case 'sa':
            return { layer: structure_1.ModuleLayers.CORE, sublayer: structure_1.CoreLayerSublayers.COMPOSITE_LOGIC };
        case 'theme':
        case 'thm':
        case 'th':
            return { layer: structure_1.ModuleLayers.FOUNDATION, sublayer: structure_1.FoundationLayerSublayers.STYLE_GUIDE };
        case 'is':
            return {
                layer: structure_1.ModuleLayers.FOUNDATION,
                sublayer: structure_1.FoundationLayerSublayers.FOUNDATION_SERVICE,
            };
        case 'lib':
        case 'drv':
            return { layer: structure_1.ModuleLayers.FOUNDATION, sublayer: structure_1.FoundationLayerSublayers.LIBRARY };
        default: break;
    }
    const prefix = moduleName.split('_').shift()?.toLowerCase();
    switch (prefix) {
        case 'cdm':
            return { layer: structure_1.ModuleLayers.FOUNDATION, sublayer: structure_1.FoundationLayerSublayers.LIBRARY };
        default: break;
    }
    return { layer: structure_1.ModuleLayers.END_USER, sublayer: structure_1.EndUserLayerSublayers.END_USER };
}
exports.moduleSuffixToLayers = moduleSuffixToLayers;
//# sourceMappingURL=outsystems-arch-canvas.js.map