import RootParser from './root-parser';
import { ModuleDetailsEntry } from '../input-spec';
import { Edge, Node } from '../structure';
export default class ModuleDetailsParser extends RootParser {
    /**
     * Given a node in the graph, get a list of all modules it contains.
     * If the node itself is a module, it itself is returned.
     * @param node
     * @param allNodes
     * @param allContainEdges
     * @private
     */
    private getModules;
    /**
     * Return the sum of the given property of all given nodes.
     * If the value is undefined for all nodes, return undefined.
     * If the value is a string or undefined for some nodes, it counts as zero.
     * @param nodes List of nodes to sum
     * @param property Name of numerical node property
     * @private
     */
    private getNumericalSumProperty;
    constructor(entries: ModuleDetailsEntry[], includeModuleLayerLayer: boolean);
    /**
     * Propagate numerical module properties to their respective parent nodes by summing them up.
     * @param nodes
     * @param edges List of edges. Internally filtered to only use CONTAINS edges
     */
    propagateModuleProperties(nodes: Node[], edges: Edge[]): void;
}
