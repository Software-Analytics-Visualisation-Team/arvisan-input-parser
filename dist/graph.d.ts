import { Edge, Graph, Node } from './structure';
/**
 * Helper function to check if a node exists
 * @param nodes
 * @param id
 */
export declare function nodeExists(nodes: Node[], id: string): boolean;
/**
 * Helper function to check if an edge exists
 * @param edges
 * @param source
 * @param target
 */
export declare function edgeExists(edges: Edge[], source: string, target: string): boolean;
/**
 * Validate that the graph adheres to the ClassViz spec
 * https://rsatrioadi.github.io/classviz/
 * @param graph
 * @param propagatedProperties Whether or not all the nodes should
 * contain propagated module properties
 */
export declare function validateGraph(graph: Graph, propagatedProperties?: boolean): void;
