import neo4j from 'neo4j-driver';
import stringifyObject from 'stringify-object';
import { Edge, Graph, Node } from './structure';
import { getViolationsAsGraph } from './violations';

const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', ''));

function createNodeQuery(n: Node): string {
  const propertiesString = Object.keys(n.data.properties)
    .filter((key) => !['traces'].includes(key))
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .map((key) => `${key}: ${JSON.stringify(n.data.properties[key])}`).join(', ');
  return `(${n.data.id}:${n.data.labels[0]} {id: '${n.data.id}', ${propertiesString}})`;
}

function createEdgeQuery(e: Edge, nodes: Node[]): string {
  const source = nodes.find((n) => n.data.id === e.data.source);
  const target = nodes.find((n) => n.data.id === e.data.target);
  if (source == null || target == null) throw new Error('Source and/or target nodes do not exist');
  return `(${e.data.source})-[:${e.data.label.toUpperCase()} ${stringifyObject({ ...e.data.properties, id: e.data.id }, { singleQuotes: false })}]->(${e.data.target})`;
}

function createQuery(g: Graph): string {
  const query = `CREATE ${g.elements.nodes.map((n) => createNodeQuery(n)).join(', ')}, ${g.elements.edges.map((e) => createEdgeQuery(e, g.elements.nodes))}`;
  console.log('Built query...');
  return query;
}

export default async function injectGraph(graph: Graph) {
  console.log('Seeding Neo4j database...');
  const session = driver.session();
  try {
    await session.run('MATCH (n) DETACH delete n');
  } catch (e) {
    console.error(`Could not delete graph: ${e}`);
    await session.close();
    await driver.close();
    return;
  }

  try {
    await session.run(createQuery(graph));
    console.log('Seeded entries');
    await session.run(createQuery(getViolationsAsGraph()));
    console.log('Seeded violations');
    console.log('Seeded database');
  } catch (e) {
    console.error(`Could not inject graph: ${e}`);
  } finally {
    await session.close();
    await driver.close();
  }
}
