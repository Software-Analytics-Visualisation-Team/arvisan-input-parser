"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getViolationsAsGraph = void 0;
const structure_1 = require("./structure");
function getName(sublayer) {
    return `Sublayer_${sublayer}`;
}
function createSublayerNodes(layer, sublayers) {
    return sublayers.map((sublayer) => ({
        data: {
            id: getName(sublayer),
            labels: [getName(sublayer)],
            properties: {
                fullName: getName(sublayer),
                simpleName: getName(sublayer),
                color: structure_1.moduleColors[layer],
                dependencyProfileCategory: structure_1.ModuleDependencyProfileCategory.NONE,
                cohesion: -1,
            },
        },
    }));
}
function createLayerViolationEdges(sublayersFrom, sublayersTo) {
    return sublayersFrom.map((from) => sublayersTo.map((to) => ({
        data: {
            id: `${getName(from)}-${getName(to)}`,
            label: structure_1.RelationshipLabel.VIOLATES,
            source: getName(from),
            target: getName(to),
            properties: {
                references: new Map(),
            },
        },
    }))).flat();
}
function createSublayerViolationEdges(sublayers) {
    return sublayers.map((to, index) => sublayers
        .slice(index + 1).map((from) => ({
        data: {
            id: `${getName(from)}-${getName(to)}`,
            label: structure_1.RelationshipLabel.VIOLATES,
            source: getName(from),
            target: getName(to),
            properties: {
                references: new Map(),
            },
        },
    }))).flat();
}
function getViolationsAsGraph() {
    const endUserSublayers = Object.values(structure_1.EndUserLayerSublayers);
    const coreSublayers = Object.values(structure_1.CoreLayerSublayers);
    const foundationSublayers = Object.values(structure_1.FoundationLayerSublayers);
    const nodes = [
        ...createSublayerNodes(structure_1.ModuleLayers.END_USER, endUserSublayers),
        ...createSublayerNodes(structure_1.ModuleLayers.CORE, coreSublayers),
        ...createSublayerNodes(structure_1.ModuleLayers.FOUNDATION, foundationSublayers),
    ];
    const edges = createSublayerViolationEdges(structure_1.sublayerOrdering);
    return { elements: { nodes, edges } };
}
exports.getViolationsAsGraph = getViolationsAsGraph;
//# sourceMappingURL=violations.js.map