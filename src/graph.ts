import { Edge, Graph, Node } from './structure';

/**
 * Helper function to check if a node exists
 * @param nodes
 * @param id
 */
export function nodeExists(nodes: Node[], id: string) {
  return nodes.findIndex((n) => n.data.id === id) >= 0;
}

/**
 * Helper function to check if an edge exists
 * @param edges
 * @param source
 * @param target
 */
export function edgeExists(edges: Edge[], source: string, target: string) {
  return edges.findIndex((e) => e.data.source === source && e.data.target === target) >= 0;
}

/**
 * Validate that the graph adheres to the ClassViz spec
 * https://rsatrioadi.github.io/classviz/
 * @param graph
 */
export function validateGraph(graph: Graph) {
  graph.elements.nodes.forEach((n, i, all) => {
    // Every node should have a unique ID
    if (all.filter((n2) => n2.data.id === n.data.id).length > 1) {
      throw new Error(`There exists more than one node with ID ${n.data.id}`);
    }
  });

  graph.elements.edges.forEach((e, i, all) => {
    // Every edge should have a unique ID
    if (all.filter((e2) => e2.data.id === e.data.id).length > 1) {
      throw new Error(`There exists more than one edge with ID ${e.data.id}`);
    }

    // Source should exist
    if (!nodeExists(graph.elements.nodes, e.data.source)) {
      throw new Error(`Source node with ID ${e.data.source} does not exist!`);
    }
    // Target should exist
    if (!nodeExists(graph.elements.nodes, e.data.target)) {
      throw new Error(`Source node with ID ${e.data.target} does not exist!`);
    }
  });
}
