import neo4j from 'neo4j-driver';
import stringifyObject from 'stringify-object';
import { execSync } from 'node:child_process';
import fs from 'fs';
import path from 'node:path';
import { Edge, Graph, Node } from './structure';
import { getViolationsAsGraph } from './violations';
import logger from './logger';

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
  logger.info('Built query...');
  return query;
}

export default async function injectGraph(graph: Graph, password: string, url = 'bolt://localhost:7687') {
  logger.info('Seeding Neo4j database...');

  const driver = neo4j.driver(url, neo4j.auth.basic('neo4j', password));

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
    logger.info('Seeded entries');
    await session.run(createQuery(getViolationsAsGraph()));
    logger.info('Seeded violations');
    logger.info('Seeded database');
  } catch (e) {
    console.error(`Could not inject graph: ${e}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

export function importGraphIntoNeo4j(neo4jHomeDir: string, nodesFile = 'nodes.csv', edgesFile = 'relationships.csv') {
  if (!fs.existsSync(neo4jHomeDir)) {
    throw new Error('Neo4j Home Directory cannot be found. See https://neo4j.com/docs/operations-manual/current/configuration/file-locations/ to find the path to your home directory.');
  }
  const executablePath = path.join(neo4jHomeDir, '/bin/neo4j-admin');
  if (!fs.existsSync(executablePath) && !fs.existsSync(`${executablePath}.bat`) && !fs.existsSync(`${executablePath}.ps1`)) {
    throw new Error('/bin/neo4j-admin cannot be found in the given Neo4j home directory');
  }
  if (!fs.existsSync(nodesFile)) {
    throw new Error(`${nodesFile} (containing all nodes) cannot be found on disk`);
  }
  if (!fs.existsSync(edgesFile)) {
    throw new Error(`${edgesFile} (containing all edges) cannot be found on disk`);
  }
  fs.copyFileSync(nodesFile, path.join(neo4jHomeDir, '/import/nodes.csv'));
  fs.copyFileSync(edgesFile, path.join(neo4jHomeDir, '/import/relationships.csv'));

  execSync(`${executablePath} database import full --overwrite-destination --nodes=import/nodes.csv --relationships=import/relationships.csv neo4j`, { stdio: 'inherit' });
}
