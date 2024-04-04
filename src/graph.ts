import {
  Edge, Graph, GraphLayers, Node, optionalModuleProperties,
} from './structure';

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
 * @param propagatedProperties Whether or not all the nodes should
 * contain propagated module properties
 */
export function validateGraph(graph: Graph, propagatedProperties = false) {
  graph.elements.nodes.forEach((n, i, all) => {
    // Every node should have a unique ID
    if (all.filter((n2) => n2.data.id === n.data.id).length > 1) {
      throw new Error(`There exists more than one node with ID ${n.data.id}`);
    }
  });

  // Check correct labels for domain nodes
  graph.elements.nodes.filter((n) => n.data.id.startsWith('D_'))
    .forEach((n) => {
      if (n.data.labels.length !== 1 || n.data.labels[0] !== GraphLayers.DOMAIN) {
        throw new Error(`Domain node ${n.data.id} does not have a single "Domain" label (has ${n.data.labels.toString()} instead).`);
      }
    });

  // Check correct labels for application nodes
  graph.elements.nodes.filter((n) => n.data.id.startsWith('A_') && !n.data.id.includes('__'))
    .forEach((n) => {
      if (n.data.labels.length !== 1 || n.data.labels[0] !== GraphLayers.APPLICATION) {
        throw new Error(`Application node ${n.data.id} does not have a single "Application" label (has ${n.data.labels.toString()} instead).`);
      }
    });

  // Check correct labels for module nodes
  graph.elements.nodes.filter((n) => n.data.id.startsWith('A_') && n.data.id.includes('__M_'))
    .forEach((n) => {
      if (n.data.labels.length !== 1 || n.data.labels[0] !== GraphLayers.MODULE) {
        throw new Error(`Module node ${n.data.id} does not have a single "Module" label (has ${n.data.labels.toString()} instead).`);
      }
    });

  // Check if all module properties are propagated correctly to higher layers, but only
  // if that should have happened (i.e. we have actually set such properties on the module
  // layer)
  if (propagatedProperties) {
    graph.elements.nodes.forEach((n) => {
      optionalModuleProperties.forEach((property) => {
        if (n.data.properties[property] === undefined) {
          throw new Error(`Node property "${property}" is undefined for node "${n.data.id}", but that should not be the case.`);
        }
      });
    });
  }

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

    // Dependency edges have a corresponding type
    if (e.data.label !== 'contains' && (e.data.properties.dependencyTypes === undefined || e.data.properties.dependencyTypes.length === 0)) {
      throw new Error(`Dependency edge ${e.data.id} with source ${e.data.source} and target ${e.data.target} has no dependency types`);
    }

    // Every node has at most one incoming containment edge
    if (e.data.label === 'contains') {
      const matchIndex = all.findIndex((e2) => e2.data.target === e.data.target && e2.data.label === 'contains');
      if (matchIndex !== i) {
        throw new Error(`Target node ${e.data.target} has at least two incoming containment edges: ${e.data.id} and ${all[matchIndex].data.id}`);
      }
    }
  });
}
