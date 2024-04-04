import fs from 'fs';
import {
  Edge, EdgeProperties, Graph, Node, NodeProperties,
} from './structure';

export function writeNodesToDisk(nodes: Node[], fileName = 'nodes.csv', header = true) {
  const headers: ('id:ID' | ':LABEL' | keyof NodeProperties)[] = [
    'id:ID', ':LABEL', 'fullName', 'simpleName', 'color', 'depth:INT' as 'depth', 'dependencyProfileCategory', 'cohesion',
    // Optional properties
    'fileSizeKB:INT' as 'fileSizeKB', 'nrScreens:INT' as 'nrScreens', 'nrEntities:INT' as 'nrEntities',
    'nrPublicElements:INT' as 'nrPublicElements', 'nrRESTConsumers:INT' as 'nrRESTConsumers', 'nrRESTProducers:INT' as 'nrRESTProducers',
  ];
  const rows = nodes
    .map((n) => [
      n.data.id,
      n.data.labels.join(';'),
      n.data.properties.fullName,
      n.data.properties.simpleName,
      n.data.properties.color,
      n.data.properties.depth,
      n.data.properties.dependencyProfileCategory,
      n.data.properties.cohesion,
      // Optional properties
      n.data.properties.fileSizeKB,
      n.data.properties.nrScreens,
      n.data.properties.nrEntities,
      n.data.properties.nrPublicElements,
      n.data.properties.nrRESTConsumers,
      n.data.properties.nrRESTProducers,
    ])
    .map((row) => {
      if (row.length !== headers.length) {
        throw new Error(`Row ${row} does not have the correct amount of columns`);
      }
      return row;
    })
    .map((x) => x.join(','));
  if (header) {
    fs.writeFileSync(fileName, [headers, ...rows].join('\r\n'));
  } else {
    fs.writeFileSync(fileName, rows.join('\r\n'));
  }
}

export function writeEdgesToDisk(edges: Edge[], fileName = 'relationships.csv', header = true) {
  const headers: ('id' | ':TYPE' | ':START_ID' | ':END_ID' | keyof EdgeProperties)[] = ['id', ':TYPE', ':START_ID', ':END_ID', 'referenceTypes', 'dependencyTypes', 'referenceNames', 'nrDependencies:INT' as 'nrDependencies', 'nrCalls:INT' as 'nrCalls'];
  const rows = edges
    .map((n) => ([
      n.data.id,
      n.data.label.toUpperCase(),
      n.data.source,
      n.data.target,
      n.data.properties.referenceTypes.join('|'),
      n.data.properties.dependencyTypes?.join('|'),
      n.data.properties.referenceNames.join('|'),
      n.data.properties.nrDependencies,
      n.data.properties.nrCalls,
    ]))
    .map((row) => {
      if (row.length !== headers.length) {
        throw new Error(`Row ${row} does not have the correct amount of columns`);
      }
      return row;
    })
    .map((x) => x.join(','));

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
