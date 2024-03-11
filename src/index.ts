import { program } from 'commander';
import fs from 'fs';
import getGraph from './parser';
import { validateGraph } from './graph';
import injectGraph, { importGraphIntoNeo4j } from './neo4j-inject';
import logger from './logger';
import graphToCsv from './csv';
import { getViolationsAsGraph } from './violations';
import { Graph } from './structure';

function groupInputFiles(newFile: string, allFiles: string[]) {
  allFiles.push(newFile);
  return allFiles;
}

program
  .name('npm run transform')
  .description('Small tool to parse OutSystems architecture/dependency datasets into ')
  .option('-s, --seedLocal <Neo4jHomeDir>', 'seed the resulting graph the Neo4j database, which can be found at the given Neo4j home directory')
  .option('--seedRemotePassword <password>', 'seed the resulting graph the Neo4j database, which can be accessed using the given password')
  .option('--seedRemoteUrl <password>', 'seed the resulting graph the Neo4j database, which can be found at the given url (optional)')
  .option('-j, --json', 'output the resulting graph as a .json file')
  .option('-c, --csv', 'output the resulting graph as a .csv file with nodes and a .csv file with edges')
  .option('-l, --layer', 'include "layer" nodes in the resulting graph')
  .requiredOption('-g, --grouping <file>', 'location of domain (application group) dataset')
  .requiredOption('-d, --dependencies <files>', 'one or more locations of dependency dataset(s)', groupInputFiles, []);

program.parse();

const options = program.opts();

const graph = getGraph(options.grouping, options.dependencies, !!options.layer);
const violations = getViolationsAsGraph();
logger.info(`Generated LPG with ${graph.elements.nodes.length} nodes and ${graph.elements.edges.length} edges.`);

logger.info('Validating graph...');
validateGraph(graph);
logger.info('Graph successfully validated');

if (options.json) {
  fs.writeFileSync('graph.json', JSON.stringify(graph, null, 4));
  logger.info('Graph written to .json file');
}
if (options.csv || options.seedLocal) {
  const totalGraph: Graph = {
    elements: {
      nodes: [...graph.elements.nodes, ...violations.elements.nodes],
      edges: [...graph.elements.edges, ...violations.elements.edges],
    },
  };
  graphToCsv(totalGraph);
  logger.info('Graph written to .csv files');
}

if (options.seedLocal) {
  logger.info('Start seeding to Neo4j database...');
  importGraphIntoNeo4j(options.seedLocal);
  logger.info('Seeded to Neo4j database!');
}

if (options.seedRemotePassword) {
  injectGraph(graph, options.seedRemotePassword, options.seedRemoteUrl).then(() => {
    logger.info('Tasks finished. Exit.');
    process.exit(0);
  });
} else {
  logger.info('Tasks finished. Exit.');
}
