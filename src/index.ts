import { program } from 'commander';
import fs from 'fs';
import path from 'node:path';
import getGraph from './parser';
import { validateGraph } from './graph';
import { copyCsvDatasets, injectGraphAdminTools, injectGraphCypher } from './neo4j-inject';
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
  .option('-s, --seedLocal <Neo4jHomeDir>', 'seed the resulting graph the Neo4j database using Neo4j Admin tools, which can be found at the given Neo4j home directory')
  .option('--database <name>', 'name of the Neo4j database, defaults to "neo4j"')
  .option('--seedQueryPassword <password>', 'seed the resulting graph the Neo4j database using a query, which can be accessed using the given password')
  .option('--seedQueryImportDir <Neo4jImportDir>', 'seed the resulting graph the Neo4j database using a query, which has the following import directory')
  .option('--seedQueryUrl <url>', 'seed the resulting graph the Neo4j database using a query, which can be found at the given url (optional)')
  .option('-j, --json', 'output the resulting graph as a .json file')
  .option('-l, --layer', 'include "layer" nodes in the resulting graph')
  .option('-g, --grouping <files>', 'locations of domain (application group) and sublayer dataset(s)', groupInputFiles, [])
  .option('-d, --dependencies <files>', 'locations of dependency dataset(s)', groupInputFiles, [])
  .option('-i, --integrations <files>', 'locations of integration/service API dataset(s)', groupInputFiles, [])
  .option('-m, --moduleDetails <files>', 'locations of module details dataset(s)', groupInputFiles, [])
  .option('-a, --anonymize', 'output should be anonymized with')
  .option('-f, --filter <domainNames>', 'which domains to filter on', groupInputFiles, []);

program.parse();

const options = program.opts();

logger.info('Reading files from disk...');
const groupingData = options.grouping?.map(readFileFromDisk);
const dependencyFiles = options.dependencies?.map(readFileFromDisk);
const integrationFile = options.integrations?.map(readFileFromDisk);
const detailsFiles = options.moduleDetails?.map(readFileFromDisk);
logger.info('    Done!');

const graph = getGraph(
  groupingData,
  dependencyFiles,
  integrationFile,
  detailsFiles,
  !!options.layer,
  !!options.anonymize,
  options.filter,
);
const violations = getViolationsAsGraph();
logger.info(`Generated LPG with ${graph.elements.nodes.length} nodes and ${graph.elements.edges.length} edges.`);

// If we have at least one module details file, all nodes should have aggregates
// of these numerical properties.
const propagatedProperties = options.moduleDetails.length > 0;
validateGraph(graph, propagatedProperties);

if (options.json) {
  fs.writeFileSync('graph.json', JSON.stringify(graph, null, 4));
  logger.info('Graph written to .json file');
}

const totalGraph: Graph = {
  elements: {
    nodes: [...graph.elements.nodes, ...violations.elements.nodes],
    edges: [...graph.elements.edges, ...violations.elements.edges],
  },
};
graphToCsv(totalGraph);
logger.info('Graph written to .csv files');

if (options.seedLocal) {
  logger.info('Start seeding to Neo4j database...');
  copyCsvDatasets(path.join(options.seedLocal, '/import'));
  injectGraphAdminTools(options.seedLocal, options.database);
  logger.info('    Done!');
}

function finish() {
  const finishTime = new Date().getTime() - startTime.getTime();
  logger.info(`Tasks finished in ${Math.round(finishTime / 1000)}s. Exit.`);
}

if (options.seedQueryPassword && options.seedQueryImportDir) {
  copyCsvDatasets(options.seedQueryImportDir);
  injectGraphCypher(
    options.seedQueryPassword,
    options.database,
    options.seedRemoteUrl,
  ).then(() => {
    finish();
    process.exit(0);
  });
} else {
  finish();
}
