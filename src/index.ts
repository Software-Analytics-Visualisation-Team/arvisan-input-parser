import { program } from 'commander';
import fs from 'fs';
import getGraph from './parser';
import { validateGraph } from './graph';
import injectGraph, { importGraphIntoNeo4j } from './neo4j-inject';
import logger from './logger';
import graphToCsv from './csv';
import { getViolationsAsGraph } from './violations';
import { Graph } from './structure';
import { readFileFromDisk } from './read-files';

function groupInputFiles(newFile: string, allFiles: string[]) {
  allFiles.push(newFile);
  return allFiles;
}

const startTime = new Date();

program
  .name('npm run transform')
  .description('Small tool to parse OutSystems architecture/dependency datasets into ')
  .option('-s, --seedLocal <Neo4jHomeDir>', 'seed the resulting graph the Neo4j database, which can be found at the given Neo4j home directory')
  .option('--database <name>', 'name of the Neo4j database, defaults to "neo4j"')
  .option('--seedRemotePassword <password>', 'seed the resulting graph the Neo4j database, which can be accessed using the given password')
  .option('--seedRemoteUrl <password>', 'seed the resulting graph the Neo4j database, which can be found at the given url (optional)')
  .option('-j, --json', 'output the resulting graph as a .json file')
  .option('-c, --csv', 'output the resulting graph as a .csv file with nodes and a .csv file with edges')
  .option('-l, --layer', 'include "layer" nodes in the resulting graph')
  .requiredOption('-g, --grouping <files>', 'location of domain (application group) and sublayer dataset(s)', groupInputFiles, [])
  .requiredOption('-d, --dependencies <files>', 'one or more locations of dependency dataset(s)', groupInputFiles, [])
  .option('-i, --integrations <file>', 'location of integration/service API dataset')
  .option('-m, --moduleDetails <files>', 'one or more locations of module details dataset(s)', groupInputFiles, [])
  .option('-a, --anonymize', 'output should be anonymized with');

program.parse();

const options = program.opts();

logger.info('Reading files from disk...');
const groupingData = options.grouping.map(readFileFromDisk);
const dependencyFiles = options.dependencies.map(readFileFromDisk);
const integrationFile = readFileFromDisk(options.integrations);
const detailsFiles = options.moduleDetails.map(readFileFromDisk);
logger.info('    Done!');

const graph = getGraph(
  groupingData,
  dependencyFiles,
  integrationFile,
  detailsFiles,
  !!options.layer,
  !!options.anonymize,
);
const violations = getViolationsAsGraph();
logger.info(`Generated LPG with ${graph.elements.nodes.length} nodes and ${graph.elements.edges.length} edges.`);

logger.info('Validating graph...');
// If we have at least one module details file, all nodes should have aggregates
// of these numerical properties.
const propagatedProperties = options.moduleDetails.length > 0;
validateGraph(graph, propagatedProperties);
logger.info('    Done!');

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
  importGraphIntoNeo4j(options.seedLocal, options.database);
  logger.info('    Done!');
}

function finish() {
  const finishTime = new Date().getTime() - startTime.getTime();
  logger.info(`Tasks finished in ${Math.round(finishTime / 1000)}s. Exit.`);
}

if (options.seedRemotePassword) {
  injectGraph(graph, options.seedRemotePassword, options.seedRemoteUrl).then(() => {
    finish();
    process.exit(0);
  });
} else {
  finish();
}
