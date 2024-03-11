import fs from 'fs';
import {
  Edge, EdgeProperties, Graph, Node, NodeProperties,
} from './structure';

export function writeNodesToDisk(nodes: Node[], fileName = 'nodes.csv', header = true) {
  const headers: ('id:ID' | ':LABEL' | keyof NodeProperties)[] = ['id:ID', ':LABEL', 'fullName', 'simpleName', 'color', 'depth:INT' as 'depth'];
  const rows = nodes
    .map((n) => [
      n.data.id,
      n.data.labels.join(';'),
      n.data.properties.fullName,
      n.data.properties.simpleName,
      n.data.properties.color,
      n.data.properties.depth,
    ].map((x) => x.toString()).join(','));
  if (header) {
    fs.writeFileSync(fileName, [headers, ...rows].join('\r\n'));
  } else {
    fs.writeFileSync(fileName, rows.join('\r\n'));
  }
}

export function writeEdgesToDisk(edges: Edge[], fileName = 'relationships.csv', header = true) {
  const headers: ('id' | ':TYPE' | ':START_ID' | ':END_ID' | keyof EdgeProperties)[] = ['id', ':TYPE', ':START_ID', ':END_ID', 'referenceType', 'dependencyType', 'referenceName', 'nrDependencies', 'nrCalls'];
  const rows = edges
    .map((n) => [
      n.data.id,
      n.data.label.toUpperCase(),
      n.data.source,
      n.data.target,
      n.data.properties.referenceType,
      n.data.properties.dependencyType,
      n.data.properties.referenceName,
      n.data.properties.nrDependencies,
      n.data.properties.nrCalls,
    ].map((x) => x?.toString() ?? '').join(','));
  if (header) {
    fs.writeFileSync(fileName, [headers, ...rows].join('\r\n'));
  } else {
    fs.writeFileSync(fileName, rows.join('\r\n'));
  }
}

export default function graphToCsv(graph: Graph, name?: string, header = true) {
  writeNodesToDisk(graph.elements.nodes, name ? `${name}-nodes.csv` : undefined, header);
  writeEdgesToDisk(graph.elements.edges, name ? `${name}-relationships.csv` : undefined, header);
}
