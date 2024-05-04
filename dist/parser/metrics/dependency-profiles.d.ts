import { Edge, Node } from '../../structure';
/**
 * Dependency profiles as based on:
 *
 * Bouwers, Eric, Arie van Deursen, and Joost Visser. "Dependency profiles for software
 * architecture evaluations." 2011 27th IEEE International Conference on Software
 * Maintenance (ICSM). IEEE, 2011.
 */
export default class DependencyProfiles {
    /**
     * Mapping of a node to a list of its ancestors. Used to reduce computation time of
     * @private
     */
    private ancestorsCache;
    /**
     * Given a node, get a list of all this node's parent nodes (including itself).
     * @param node
     * @param allNodes
     * @param allEdges
     * @private
     */
    private getAncestors;
    /**
     * Get the parent node of the given node at the given level
     * @param node
     * @param level
     * @param allNodes
     * @param allEdges
     * @private
     */
    private getContainmentLevelNode;
    /**
     * Add the module dependency profile to each given module node in-place.
     * @param moduleNodes
     * @param nodes
     * @param edges
     */
    find(moduleNodes: Node[], nodes: Node[], edges: Edge[]): void;
}
