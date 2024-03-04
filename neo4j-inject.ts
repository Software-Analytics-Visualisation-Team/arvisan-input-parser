import neo4j from 'neo4j-driver';
import { Edge, graph, Node } from './index';

const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', ''));

function getNodeIdentifier(n: Node): string {
  return `${n.data.labels[0]} {id: '${n.data.id}'}`;
}

function createNodeQuery(n: Node): string {
  return `(${n.data.id}:${getNodeIdentifier(n)})`;
}

function createEdgeQuery(e: Edge, nodes: Node[]): string {
  const source = nodes.find((n) => n.data.id === e.data.source);
  const target = nodes.find((n) => n.data.id === e.data.target);
  if (source == null || target == null) throw new Error('Source and/or target nodes do not exist');
  return `(${e.data.source})-[:${e.data.label.toUpperCase()} {id: '${e.data.id}'}]->(${e.data.target})`;
  // return `MATCH (source:${getNodeIdentifier(source)}), (target:${getNodeIdentifier(target)})
  // CREATE (source)-[:${e.data.label.toUpperCase()} {id: '${e.data.id}'}]->(target)`;
}

async function injectGraph() {
  const session = driver.session();
  try {
    await session.run(`CREATE ${graph.elements.nodes.map((n) => createNodeQuery(n)).join(', ')}, ${graph.elements.edges.map((e) => createEdgeQuery(e, graph.elements.nodes))}`);
    // await Promise.all(graph.elements.edges.map(async (edge) => {
    //   const session = driver.session();
    //   await session.run(createEdgeQuery(edge, graph.elements.nodes));
    //   await session.close();
    // }));
    console.log('Seeded database');
  } catch (e) {
    console.error(`Could not inject graph: ${e}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

console.log('Seeding Neo4j database...');
injectGraph().then(() => {
  // process.exit(0);
});
