"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const root_parser_1 = __importDefault(require("./root-parser"));
const structure_1 = require("../structure");
class ModuleDetailsParser extends root_parser_1.default {
    /**
     * Given a node in the graph, get a list of all modules it contains.
     * If the node itself is a module, it itself is returned.
     * @param node
     * @param allNodes
     * @param allContainEdges
     * @private
     */
    getModules(node, allNodes, allContainEdges) {
        const containEdges = allContainEdges.filter((e) => e.data.source === node.data.id);
        // Node does not have any containment edges, so this node is a module.
        if (containEdges.length === 0) {
            return [node];
        }
        const childIds = containEdges.map((e) => e.data.target);
        const children = allNodes.filter((n) => childIds.includes(n.data.id));
        return children.reduce((modules, child) => modules
            .concat(this.getModules(child, allNodes, allContainEdges)), []);
    }
    /**
     * Return the sum of the given property of all given nodes.
     * If the value is undefined for all nodes, return undefined.
     * If the value is a string or undefined for some nodes, it counts as zero.
     * @param nodes List of nodes to sum
     * @param property Name of numerical node property
     * @private
     */
    getNumericalSumProperty(nodes, property) {
        // TODO: fix dataset so all modules are contained in the "Module details" datasets
        // const values = nodes.map((n) => n.data.properties[property]);
        // if (values.every((v) => v === undefined)) return undefined;
        return nodes.reduce((total, n) => {
            const value = n.data.properties[property];
            if (value === undefined)
                return total;
            return total + value;
        }, 0);
    }
    constructor(entries, includeModuleLayerLayer) {
        super(includeModuleLayerLayer);
        entries.forEach((e) => {
            const moduleNode = this.getApplicationAndModule(e['Application Name'], e['Module Name']);
            moduleNode.data.properties.fileSizeKB = e['File Size KB'];
            moduleNode.data.properties.nrScreens = e['Count Screens'];
            moduleNode.data.properties.nrEntities = e['Count Entities'];
            moduleNode.data.properties.nrPublicElements = e['Count Public Elements'];
            moduleNode.data.properties.nrRESTConsumers = e['Count REST Consumer'];
            moduleNode.data.properties.nrRESTProducers = e['Count REST Producer'];
        });
    }
    /**
     * Propagate numerical module properties to their respective parent nodes by summing them up.
     * @param nodes
     * @param edges List of edges. Internally filtered to only use CONTAINS edges
     */
    propagateModuleProperties(nodes, edges) {
        const containEdges = edges.filter((e) => e.data.label === structure_1.RelationshipLabel.CONTAINS);
        // Naive approach; it would be faster to start at the top layer and recursively propagate
        // from the bottom to the top. However, for now this is easier and fast enough.
        nodes.forEach((n) => {
            const modules = this.getModules(n, nodes, containEdges);
            structure_1.optionalModuleProperties.forEach((property) => {
                // eslint-disable-next-line no-param-reassign
                n.data.properties[property] = this.getNumericalSumProperty(modules, property);
            });
        });
    }
}
exports.default = ModuleDetailsParser;
//# sourceMappingURL=module-details-parser.js.map