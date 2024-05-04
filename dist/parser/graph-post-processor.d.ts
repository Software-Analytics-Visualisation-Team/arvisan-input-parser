import { Edge, Node } from '../structure';
import RootParser from './root-parser';
/**
 * Parser that finalizes the given graph, such that it meets the output specification
 */
export default class GraphPostProcessor extends RootParser {
    nodes: Node[];
    containEdges: Edge[];
    dependencyEdges: Edge[];
    constructor(nodes: Node[], containEdges: Edge[], dependencyEdges: Edge[], includeModuleLayerLayer: boolean, anonymize: boolean, domainNames?: string[]);
    /**
     * Manually replace all application-module containment edges by a
     * sublayer classification of all modules by their suffix
     * @private
     */
    private addManualModuleSublayerClassification;
    /**
     * Assign every application node that does not have a domain parent
     * to the "no_domain" domain.
     * @private
     */
    private addNoDomainClassification;
    /**
     * Anonymize the graph by replacing all node/edge names.
     * Note that this is a destructive operation, which makes it impossible
     * to match this graph with any other graphs.
     * Nodes will get a counter as name and ID.
     * Edges will get a random UUID as ID.
     */
    private anonymizeGraph;
    private filterDuplicates;
    /**
     * Find all leaf nodes of the given node
     * @param node
     * @private
     */
    private findLeaves;
    /**
     * Find all ancestors of the given nodes (including their edges),
     * excluding the node itself.
     * @param node
     * @private
     */
    private findAncestorWithEdges;
    /**
     * Given a set of nodes, find all outgoing dependency edges and their target nodes
     * that have not been seen before.
     * @param modules
     * @param seenEdgeIds
     * @private
     */
    private findOutgoingDependenciesWithEdges;
    /**
     * Given a set of nodes, find all incoming dependency edges and their target nodes
     * that have not been seen before.
     * @param modules
     * @param seenEdgeIds
     * @private
     */
    private findIncomingDependenciesWithEdges;
    /**
     * Only keep the given domains and all their dependencies in the graph.
     * Delete the rest
     * @param domainNames
     * @private
     */
    private filterGraphByDomains;
}
