import fs from 'fs';
import {
  Edge, EdgeProperties, Node, NodeProperties,
} from './structure';

export function writeNodesToDisk(nodes: Node[]) {
  const headers: ('id:ID' | ':LABEL' | keyof NodeProperties)[] = ['id:ID', ':LABEL', 'fullName', 'simpleName', 'color', 'depth:int' as 'depth'];
  const rows = nodes
    .map((n) => [
      n.data.id,
      n.data.labels.join(';'),
      n.data.properties.fullName,
      n.data.properties.simpleName,
      n.data.properties.color,
    ].map((x) => x.toString()).join(','));
  fs.writeFileSync('nodes.csv', [headers, ...rows].join('\r\n'));
}

export function writeEdgesToDisk(edges: Edge[]) {
  const headers: ('id' | ':TYPE' | ':START_ID' | ':END_ID' | keyof EdgeProperties)[] = ['id', ':TYPE', ':START_ID', ':END_ID', 'referenceType', 'dependencyType', 'weight'];
  const rows = edges
    .map((n) => [
      n.data.id,
      n.data.label.toUpperCase(),
      n.data.source,
      n.data.target,
      n.data.properties.referenceType,
      n.data.properties.dependencyType,
      n.data.properties.weight,
    ].map((x) => x?.toString() ?? '').join(','));
  fs.writeFileSync('relationships.csv', [headers, ...rows].join('\r\n'));
}
