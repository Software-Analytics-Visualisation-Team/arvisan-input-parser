import { readFile, utils } from 'xlsx';
import {
  Edge,
  Graph, GraphLayers, Node,
} from '../structure';
import logger from '../logger';
import { ApplicationGroupEntry, ConsumerProducerEntry } from './outsystems-arch-canvas';
import ConsumerProducerParser from './consumer-producer-parser';
import ApplicationGroupParser from './application-group-parser';

function removeDuplicates<T extends Node | Edge>(elements: T[]) {
  return elements.filter((n, index, all) => index === all
    .findIndex((n2) => n.data.id === n2.data.id));
}

export default function getGraph(
  structureFile: string,
  dependencyFiles: string[],
  includeModuleLayerLayer = false,
): Graph {
  logger.info('Loading files...');

  const applicationWorkbook = readFile(structureFile);
  const applicationEntries: ApplicationGroupEntry[] = utils
    .sheet_to_json(applicationWorkbook.Sheets[applicationWorkbook.SheetNames[0]]);

  const consumerProducerWorkbooks = dependencyFiles.map((file) => readFile(file));
  const consumerProducerEntries = consumerProducerWorkbooks
    .map((workbook): ConsumerProducerEntry[] => utils
      .sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]))
    .flat();

  logger.info('Loaded files!');

  logger.info('Parsing consumer/producer datasets...');
  const cpParser = new ConsumerProducerParser(consumerProducerEntries, includeModuleLayerLayer);
  logger.info('Parsed consumer/producer datasets!');
  logger.info('Parsing application group dataset...');
  const agParser = new ApplicationGroupParser(applicationEntries, includeModuleLayerLayer);
  logger.info('Parsed application group dataset!');

  logger.info('Merging datasets...');
  const nodes = removeDuplicates([...cpParser.nodes, ...agParser.nodes]);
  const edges = removeDuplicates([
    ...cpParser.containEdges,
    ...cpParser.dependencyEdges,
    ...agParser.containEdges,
  ]);
  logger.info('Merged datasets!');

  logger.info('Add domain to applications that have none...');
  const defaultDomainNode: Node = agParser.createDomainNode('no_domain');
  const applicationNodes = nodes.filter((n) => n.data.labels.includes(GraphLayers.APPLICATION));
  const noDomainContainEdges = applicationNodes
    // Application only has incoming/outgoing dependency edges
    .filter((applicationNode) => !edges.find((e) => e.data.target === applicationNode.data.id))
    .map((applicationNode) => agParser.createContainEdge(defaultDomainNode, applicationNode));
  logger.info('Added domain parents!');

  return {
    elements: { nodes: [defaultDomainNode, ...nodes], edges: [...edges, ...noDomainContainEdges] },
  };
}
