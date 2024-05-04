"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unclassifiedDomainName = exports.formatName = exports.DependencyType = exports.RelationshipLabel = exports.optionalModuleProperties = exports.ModuleDependencyProfileCategory = exports.sublayerOrdering = exports.moduleColors = exports.FoundationLayerSublayers = exports.CoreLayerSublayers = exports.EndUserLayerSublayers = exports.ModuleLayers = exports.GraphLayers = void 0;
var GraphLayers;
(function (GraphLayers) {
    GraphLayers["DOMAIN"] = "Domain";
    GraphLayers["APPLICATION"] = "Application";
    GraphLayers["LAYER"] = "Layer";
    GraphLayers["SUB_LAYER"] = "Sublayer";
    GraphLayers["MODULE"] = "Module";
})(GraphLayers || (exports.GraphLayers = GraphLayers = {}));
var ModuleLayers;
(function (ModuleLayers) {
    ModuleLayers["END_USER"] = "Enduser";
    ModuleLayers["CORE"] = "Core";
    ModuleLayers["FOUNDATION"] = "Foundation";
})(ModuleLayers || (exports.ModuleLayers = ModuleLayers = {}));
var EndUserLayerSublayers;
(function (EndUserLayerSublayers) {
    EndUserLayerSublayers["END_USER"] = "Enduser";
})(EndUserLayerSublayers || (exports.EndUserLayerSublayers = EndUserLayerSublayers = {}));
var CoreLayerSublayers;
(function (CoreLayerSublayers) {
    CoreLayerSublayers["CORE"] = "Core";
    CoreLayerSublayers["API"] = "API";
    CoreLayerSublayers["CORE_WIDGETS"] = "CoreWidgets";
    CoreLayerSublayers["COMPOSITE_LOGIC"] = "CompositeLogic";
    CoreLayerSublayers["CORE_SERVICE"] = "CoreService";
})(CoreLayerSublayers || (exports.CoreLayerSublayers = CoreLayerSublayers = {}));
var FoundationLayerSublayers;
(function (FoundationLayerSublayers) {
    FoundationLayerSublayers["FOUNDATION"] = "Foundation";
    FoundationLayerSublayers["STYLE_GUIDE"] = "StyleGuide";
    FoundationLayerSublayers["FOUNDATION_SERVICE"] = "FoundationService";
    FoundationLayerSublayers["LIBRARY"] = "Library";
})(FoundationLayerSublayers || (exports.FoundationLayerSublayers = FoundationLayerSublayers = {}));
exports.moduleColors = {
    [ModuleLayers.END_USER]: '#3498DB',
    [ModuleLayers.CORE]: '#E67E22',
    [ModuleLayers.FOUNDATION]: '#28B463',
};
exports.sublayerOrdering = [
    EndUserLayerSublayers.END_USER,
    CoreLayerSublayers.CORE,
    CoreLayerSublayers.API,
    CoreLayerSublayers.CORE_WIDGETS,
    CoreLayerSublayers.COMPOSITE_LOGIC,
    CoreLayerSublayers.CORE_SERVICE,
    FoundationLayerSublayers.FOUNDATION,
    FoundationLayerSublayers.STYLE_GUIDE,
    FoundationLayerSublayers.FOUNDATION_SERVICE,
    FoundationLayerSublayers.LIBRARY,
];
var ModuleDependencyProfileCategory;
(function (ModuleDependencyProfileCategory) {
    ModuleDependencyProfileCategory["HIDDEN"] = "hidden";
    ModuleDependencyProfileCategory["INBOUND"] = "inbound";
    ModuleDependencyProfileCategory["OUTBOUND"] = "outbound";
    ModuleDependencyProfileCategory["TRANSIT"] = "transit";
    ModuleDependencyProfileCategory["NONE"] = "";
})(ModuleDependencyProfileCategory || (exports.ModuleDependencyProfileCategory = ModuleDependencyProfileCategory = {}));
exports.optionalModuleProperties = [
    'fileSizeKB', 'nrScreens', 'nrEntities', 'nrPublicElements', 'nrRESTConsumers', 'nrRESTProducers',
];
var RelationshipLabel;
(function (RelationshipLabel) {
    RelationshipLabel["CONTAINS"] = "contains";
    RelationshipLabel["CALLS"] = "calls";
    RelationshipLabel["VIOLATES"] = "violates";
})(RelationshipLabel || (exports.RelationshipLabel = RelationshipLabel = {}));
var DependencyType;
(function (DependencyType) {
    DependencyType["COMPILE_TIME"] = "compile_time";
    DependencyType["RUNTIME"] = "runtime";
    DependencyType["ENTITY"] = "entity";
})(DependencyType || (exports.DependencyType = DependencyType = {}));
function formatName(id) {
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
exports.formatName = formatName;
exports.unclassifiedDomainName = 'no_domain';
//# sourceMappingURL=structure.js.map