import { program } from 'commander';
import fs from 'fs';
import getGraph from './dependency-graph';
import { validateGraph } from './graph';
import injectGraph from './neo4j-inject';
import logger from './logger';

function groupInputFiles(newFile: string, allFiles: string[]) {
  allFiles.push(newFile);
  return allFiles;
}

program
  .name('npm run transform')
  .description('Small tool to parse OutSystems architecture/dependency datasets into ')
  .option('-s, --seed', 'seed the resulting graph the Neo4j database')
  .option('-j, --json', 'output the resulting graph as a .json file')
  .option('-c, --csv', 'output the resulting graph as a .csv file with nodes and a .csv file with edges')
  .option('-l, --layer', 'include "layer" nodes in the resulting graph')
  .requiredOption('-g, --grouping <file>', 'location of domain (application group) dataset')
  .requiredOption('-d, --dependencies <files>', 'one or more locations of dependency dataset(s)', groupInputFiles, []);

program.parse();

const options = program.opts();

const graph = getGraph(options.grouping, options.dependencies, !!options.layer);
logger.info(`Generated LPG with ${graph.elements.nodes.length} nodes and ${graph.elements.edges.length} edges.`);

validateGraph(graph);
logger.info('Graph successfully validated');

if (options.json) {
  fs.writeFileSync('graph.json', JSON.stringify(graph, null, 4));
}
if (options.csv) {
  fs.writeFileSync('nodes.csv', graph.elements.nodes
    .map((n) => [n.data.id, n.data.labels[0]].map((x) => x.toString()).join(';'))
    .join('\n'));
  fs.writeFileSync('relationships.csv', graph.elements.edges
    .map((n) => [n.data.id, n.data.label, n.data.source, n.data.target].map((x) => x.toString()).join(';'))
    .join('\n'));
}
if (options.json || options.csv) {
  logger.info('Graph written to disk');
}

if (options.seed) {
  injectGraph(graph).then(() => {
    process.exit(0);
  });
}
