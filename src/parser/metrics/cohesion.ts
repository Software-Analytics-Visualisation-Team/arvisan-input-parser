import {
  Edge, GraphLayers, Node, RelationshipLabel,
} from '../../structure';

export default class Cohesion {
  private static getLeafChildren(node: Node, allNodes: Node[], allEdges: Edge[]): Node[] {
    const containEdges = allEdges.filter((e) => e.data.label === RelationshipLabel.CONTAINS
      && e.data.source === node.data.id);
    // Node is a leaf, so return it
    if (containEdges.length === 0) return [node];
    const childIds = containEdges.map((e) => e.data.target);
    const childNodes = allNodes.filter((n) => childIds.includes(n.data.id));

    return childNodes.reduce((leaves: Node[], child) => leaves
      .concat(...this.getLeafChildren(child, allNodes, allEdges)), []);
  }

  static find(nodes: Node[], edges: Edge[]) {
    nodes.forEach((n) => {
      if (n.data.labels.includes(GraphLayers.MODULE)) return;
      const children = this.getLeafChildren(n, nodes, edges);
      const childIds = children.map((c) => c.data.id);

      const dependencyEdges = edges.filter((e) => e.data.label === RelationshipLabel.CALLS
        && childIds.includes(e.data.source) && childIds.includes(e.data.target));

      // eslint-disable-next-line no-param-reassign
      n.data.properties.cohesion = (dependencyEdges.length) / (childIds.length ** 1.5);
    });
  }
}
