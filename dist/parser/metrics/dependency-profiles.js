"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const structure_1 = require("../../structure");
const CONTAINMENT_LEVEL = structure_1.GraphLayers.APPLICATION;
/**
 * Dependency profiles as based on:
 *
 * Bouwers, Eric, Arie van Deursen, and Joost Visser. "Dependency profiles for software
 * architecture evaluations." 2011 27th IEEE International Conference on Software
 * Maintenance (ICSM). IEEE, 2011.
 */
class DependencyProfiles {
    constructor() {
        /**
         * Mapping of a node to a list of its ancestors. Used to reduce computation time of
         * @private
         */
        this.ancestorsCache = new Map();
    }
    /**
     * Given a node, get a list of all this node's parent nodes (including itself).
     * @param node
     * @param allNodes
     * @param allEdges
     * @private
     */
    getAncestors(node, allNodes, allEdges) {
        if (this.ancestorsCache.has(node)) {
            return this.ancestorsCache.get(node);
        }
        const containEdge = allEdges.find((e) => e.data.label === structure_1.RelationshipLabel.CONTAINS
            && e.data.target === node.data.id);
        if (containEdge === undefined)
            return [node];
        const parentNode = allNodes.find((n) => n.data.id === containEdge.data.source);
        if (parentNode === undefined)
            return [node];
        const ancestors = [node, ...this.getAncestors(parentNode, allNodes, allEdges)];
        this.ancestorsCache.set(node, ancestors);
        return ancestors;
    }
    /**
     * Get the parent node of the given node at the given level
     * @param node
     * @param level
     * @param allNodes
     * @param allEdges
     * @private
     */
    getContainmentLevelNode(node, level, allNodes, allEdges) {
        const parents = this.getAncestors(node, allNodes, allEdges);
        return parents.find((p) => p.data.labels.includes(level));
    }
    /**
     * Add the module dependency profile to each given module node in-place.
     * @param moduleNodes
     * @param nodes
     * @param edges
     */
    find(moduleNodes, nodes, edges) {
        moduleNodes.forEach((n) => {
            const parent = this.getContainmentLevelNode(n, CONTAINMENT_LEVEL, nodes, edges);
            if (!parent)
                throw new Error('Parent not found');
            const incomingEdges = edges.filter((e) => e.data.label === structure_1.RelationshipLabel.CALLS
                && e.data.target === n.data.id && e.data.source !== e.data.target);
            const incomingNodes = incomingEdges
                .map((e) => nodes.find((n2) => n2.data.id === e.data.source))
                .filter((n2) => n2 !== undefined)
                .map((n2) => n2);
            const outgoingEdges = edges.filter((e) => e.data.label === structure_1.RelationshipLabel.CALLS
                && e.data.source === n.data.id && e.data.source !== e.data.target);
            const outgoingNodes = outgoingEdges.map((e) => nodes
                .find((n2) => n2.data.id === e.data.target))
                .filter((n2) => n2 !== undefined)
                .map((n2) => n2);
            const externalIncomingNodes = incomingNodes.filter((n2) => {
                const externalParent = this.getContainmentLevelNode(n2, CONTAINMENT_LEVEL, nodes, edges);
                if (!externalParent)
                    throw new Error(`Parent of node "${n2.data.id}" not found`);
                const externalDomain = this.getContainmentLevelNode(n2, structure_1.GraphLayers.DOMAIN, nodes, edges);
                if (!externalDomain)
                    throw new Error(`Domain of node "${n2.data.id}" not found`);
                return externalDomain.data.properties.simpleName !== structure_1.unclassifiedDomainName
                    && externalParent.data.id !== parent.data.id;
            });
            const externalOutgoingNodes = outgoingNodes.filter((n2) => {
                const externalParent = this.getContainmentLevelNode(n2, CONTAINMENT_LEVEL, nodes, edges);
                if (!externalParent)
                    throw new Error(`Parent of node "${n2.data.id}" not found`);
                const externalDomain = this.getContainmentLevelNode(n2, structure_1.GraphLayers.DOMAIN, nodes, edges);
                if (!externalDomain)
                    throw new Error(`Domain of node "${n2.data.id}" not found`);
                return externalDomain.data.properties.simpleName !== structure_1.unclassifiedDomainName
                    && externalParent.data.id !== parent.data.id;
            });
            if (externalIncomingNodes.length > 0 && externalOutgoingNodes.length > 0) {
                // eslint-disable-next-line no-param-reassign
                n.data.properties.dependencyProfileCategory = structure_1.ModuleDependencyProfileCategory.TRANSIT;
            }
            else if (externalIncomingNodes.length > 0) {
                // eslint-disable-next-line no-param-reassign
                n.data.properties.dependencyProfileCategory = structure_1.ModuleDependencyProfileCategory.INBOUND;
            }
            else if (externalOutgoingNodes.length > 0) {
                // eslint-disable-next-line no-param-reassign
                n.data.properties.dependencyProfileCategory = structure_1.ModuleDependencyProfileCategory.OUTBOUND;
            }
            else {
                // eslint-disable-next-line no-param-reassign
                n.data.properties.dependencyProfileCategory = structure_1.ModuleDependencyProfileCategory.HIDDEN;
            }
        });
    }
}
exports.default = DependencyProfiles;
//# sourceMappingURL=dependency-profiles.js.map