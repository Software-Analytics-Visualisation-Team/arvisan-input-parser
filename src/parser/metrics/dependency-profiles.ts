import {
  Edge, GraphLayers, ModuleDependencyProfileCategory, Node, RelationshipLabel,
} from '../../structure';

const CONTAINMENT_LEVEL: GraphLayers = GraphLayers.APPLICATION;

/**
 * Dependency profiles as based on:
 *
 * Bouwers, Eric, Arie van Deursen, and Joost Visser. "Dependency profiles for software
 * architecture evaluations." 2011 27th IEEE International Conference on Software
 * Maintenance (ICSM). IEEE, 2011.
 */
export default class DependencyProfiles {
  /**
   * Given a node, get a list of all this node's parent nodes (including itself).
   * @param node
   * @param allNodes
   * @param allEdges
   * @private
   */
  private static getParents(node: Node, allNodes: Node[], allEdges: Edge[]): Node[] {
    const containEdge = allEdges.find((e) => e.data.label === RelationshipLabel.CONTAINS
      && e.data.target === node.data.id);
    if (containEdge === undefined) return [node];
    const parentNode = allNodes.find((n) => n.data.id === containEdge.data.source);
    if (parentNode === undefined) return [node];

    return [node, ...this.getParents(parentNode, allNodes, allEdges)];
  }

  /**
   * Get the parent node of the given node at the given level
   * @param node
   * @param level
   * @param allNodes
   * @param allEdges
   * @private
   */
  private static getContainmentLevelNode(
    node: Node,
    level: GraphLayers,
    allNodes: Node[],
    allEdges: Edge[],
  ): Node | undefined {
    const parents = this.getParents(node, allNodes, allEdges);
    return parents.find((p) => p.data.labels.includes(level));
  }

  /**
   * Add the module dependency profile to each given module node in-place.
   * @param moduleNodes
   * @param nodes
   * @param edges
   */
  static find(moduleNodes: Node[], nodes: Node[], edges: Edge[]) {
    moduleNodes.forEach((n) => {
      const parent = this.getContainmentLevelNode(n, CONTAINMENT_LEVEL, nodes, edges);
      if (!parent) throw new Error('Parent not found');

      const incomingEdges = edges.filter((e) => e.data.label === RelationshipLabel.CALLS
        && e.data.target === n.data.id && e.data.source !== e.data.target);
      const incomingNodes: Node[] = incomingEdges
        .map((e) => nodes.find((n2) => n2.data.id === e.data.source))
        .filter((n2) => n2 !== undefined)
        .map((n2) => n2!);
      const outgoingEdges = edges.filter((e) => e.data.label === RelationshipLabel.CALLS
        && e.data.source === n.data.id && e.data.source !== e.data.target);
      const outgoingNodes = outgoingEdges.map((e) => nodes
        .find((n2) => n2.data.id === e.data.target))
        .filter((n2) => n2 !== undefined)
        .map((n2) => n2!);

      const externalIncomingNodes = incomingNodes.filter((n2) => {
        const externalParent = this.getContainmentLevelNode(n2, CONTAINMENT_LEVEL, nodes, edges);
        if (!externalParent) throw new Error('Parent not found');
        return externalParent.data.id !== parent.data.id;
      });
      const externalOutgoingNodes = outgoingNodes.filter((n2) => {
        const externalParent = this.getContainmentLevelNode(n2, CONTAINMENT_LEVEL, nodes, edges);
        if (!externalParent) throw new Error('Parent not found');
        return externalParent.data.id !== parent.data.id;
      });

      if (externalIncomingNodes.length > 0 && externalOutgoingNodes.length > 0) {
        // eslint-disable-next-line no-param-reassign
        n.data.properties.dependencyProfileCategory = ModuleDependencyProfileCategory.TRANSIT;
      } else if (externalIncomingNodes.length > 0) {
        // eslint-disable-next-line no-param-reassign
        n.data.properties.dependencyProfileCategory = ModuleDependencyProfileCategory.INBOUND;
      } else if (externalOutgoingNodes.length > 0) {
        // eslint-disable-next-line no-param-reassign
        n.data.properties.dependencyProfileCategory = ModuleDependencyProfileCategory.OUTBOUND;
      } else {
        // eslint-disable-next-line no-param-reassign
        n.data.properties.dependencyProfileCategory = ModuleDependencyProfileCategory.HIDDEN;
      }
    });
  }
}
