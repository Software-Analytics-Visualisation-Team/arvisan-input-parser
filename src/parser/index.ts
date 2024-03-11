import { readFile, utils } from 'xlsx';
import {
  Edge,
  Graph, GraphLayers, Node,
} from '../structure';
import logger from '../logger';
import { ApplicationGroupEntry, ConsumerProducerEntry, IntegrationServiceAPIEntry } from './outsystems-arch-canvas';
import ConsumerProducerParser from './consumer-producer-parser';
import ApplicationGroupParser from './application-group-parser';
import IntegrationParser from './integration-parser';

function removeDuplicates<T extends Node | Edge>(elements: T[]) {
  return elements.filter((n, index, all) => index === all
    .findIndex((n2) => n.data.id === n2.data.id));
}

/**
 * Parse the given files to a Neo4j / Cytoscape graph object
 * @param structureFile File containing the structure of the landscape (domains, applications and
 * modules).
 * @param dependencyFiles One or more files containing consumers and producers.
 * @param integrationFile Optional file containing dynamic data about integrations and service APIs.
 * @param includeModuleLayerLayer Whether the "Layer" layer from the OutSystems Architecture Canvas
 * should be included in the resulting graph
 */
export default function getGraph(
  structureFile: string,
  dependencyFiles: string[],
  integrationFile?: string,
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

  const integrationWorkbook = integrationFile ? readFile(integrationFile) : undefined;
  const integrationEntries: IntegrationServiceAPIEntry[] | undefined = integrationWorkbook ? utils
    .sheet_to_json(integrationWorkbook.Sheets[applicationWorkbook.SheetNames[0]]) : undefined;

  logger.info('Loaded files!');

  logger.info('Parsing consumer/producer datasets...');
  const cpParser = new ConsumerProducerParser(consumerProducerEntries, includeModuleLayerLayer);
  logger.info('Parsed consumer/producer datasets!');

  logger.info('Parsing application group dataset...');
  const agParser = new ApplicationGroupParser(applicationEntries, includeModuleLayerLayer);
  logger.info('Parsed application group dataset!');

  let intParser: IntegrationParser | undefined;
  if (integrationEntries) {
    logger.info('Parsing integration dataset...');
    intParser = new IntegrationParser(integrationEntries, includeModuleLayerLayer);
    logger.info('Parsed integration dataset!');
  }

  logger.info('Merging datasets...');
  const nodes = removeDuplicates([
    ...cpParser.nodes,
    ...agParser.nodes,
    ...intParser ? intParser.nodes : [],
  ]);
  const edges = removeDuplicates([
    ...cpParser.containEdges,
    ...cpParser.dependencyEdges,
    ...agParser.containEdges,
    ...intParser ? intParser.containEdges : [],
    ...intParser ? intParser.dependencyEdges : [],
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
