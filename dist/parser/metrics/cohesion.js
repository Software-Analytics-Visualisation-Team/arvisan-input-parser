"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const structure_1 = require("../../structure");
class Cohesion {
    static getLeafChildren(node, allNodes, allEdges) {
        const containEdges = allEdges.filter((e) => e.data.label === structure_1.RelationshipLabel.CONTAINS
            && e.data.source === node.data.id);
        // Node is a leaf, so return it
        if (containEdges.length === 0)
            return [node];
        const childIds = containEdges.map((e) => e.data.target);
        const childNodes = allNodes.filter((n) => childIds.includes(n.data.id));
        return childNodes.reduce((leaves, child) => leaves
            .concat(...this.getLeafChildren(child, allNodes, allEdges)), []);
    }
    static find(nodes, edges) {
        nodes.forEach((n) => {
            if (n.data.labels.includes(structure_1.GraphLayers.MODULE))
                return;
            const children = this.getLeafChildren(n, nodes, edges);
            const childIds = children.map((c) => c.data.id);
            const dependencyEdges = edges.filter((e) => e.data.label === structure_1.RelationshipLabel.CALLS
                && childIds.includes(e.data.source) && childIds.includes(e.data.target));
            // eslint-disable-next-line no-param-reassign
            n.data.properties.cohesion = (dependencyEdges.length) / (childIds.length ** 1.5);
        });
    }
}
exports.default = Cohesion;
//# sourceMappingURL=cohesion.js.map