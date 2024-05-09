/// <reference types="node" />
import { Edge, Graph, Node } from './structure';
export declare function getCsvNodes(nodes: Node[], header?: boolean): Buffer;
export declare function writeNodesToDisk(nodes: Node[], fileName?: string, header?: boolean): void;
export declare function getCsvEdges(edges: Edge[], header?: boolean): Buffer;
export declare function writeEdgesToDisk(edges: Edge[], fileName?: string, header?: boolean): void;
export declare function getCsvMapping(map: Map<string, string>): Buffer;
export declare function writeMappingToDisk(map: Map<string, string>, fileName: string): void;
export default function graphToCsv(graph: Graph, name?: string, header?: boolean): void;
