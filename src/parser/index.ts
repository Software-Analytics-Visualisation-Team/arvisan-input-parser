import { readFile, utils } from 'xlsx';
import {
  Edge, Graph, GraphLayers, Node, unclassifiedDomainName,
} from '../structure';
import logger from '../logger';
import {
  ApplicationGroupEntry,
  ConsumerProducerEntry,
  IntegrationServiceAPIEntry,
  ModuleDetailsEntry,
} from '../input-spec';
import ConsumerProducerParser from './consumer-producer-parser';
import ApplicationGroupParser from './application-group-parser';
import IntegrationParser from './integration-parser';
import DependencyProfiles from './metrics/dependency-profiles';
import Cohesion from './metrics/cohesion';
import ModuleDetailsParser from './module-details-parser';

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
 * @param detailsFiles Optional one or more files containing more details about modules.
 * @param includeModuleLayerLayer Whether the "Layer" layer from the OutSystems Architecture Canvas
 * should be included in the resulting graph
 */
export default function getGraph(
  structureFile: string,
  dependencyFiles: string[],
  integrationFile?: string,
  detailsFiles: string[] = [],
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

  const dynamicDataWorkbook = integrationFile ? readFile(integrationFile) : undefined;
  const dynamicDataEntries: IntegrationServiceAPIEntry[] | undefined = dynamicDataWorkbook ? utils
    .sheet_to_json(dynamicDataWorkbook.Sheets[applicationWorkbook.SheetNames[0]]) : undefined;
  const integrationEntries = dynamicDataEntries ? dynamicDataEntries.filter((e) => e.logtype === 'Integration') : undefined;
  const serviceAPIEntries = dynamicDataEntries ? dynamicDataEntries.filter((e) => e.logtype === 'ServiceAPI') : undefined;

  const moduleDetailsWorkbooks = detailsFiles.map((file) => readFile(file));
  const moduleDetailsEntries = moduleDetailsWorkbooks
    .map((workbook): ModuleDetailsEntry[] => utils
      .sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]))
    .flat();

  logger.info('    Done!');

  let modDetailsParser: ModuleDetailsParser | undefined;
  if (moduleDetailsEntries.length > 0) {
    logger.info('Parsing module details dataset...');
    modDetailsParser = new ModuleDetailsParser(moduleDetailsEntries, includeModuleLayerLayer);
    logger.info('    Done!');
  }

  logger.info('Parsing consumer/producer datasets...');
  const cpParser = new ConsumerProducerParser(
    consumerProducerEntries,
    includeModuleLayerLayer,
    serviceAPIEntries,
  );
  logger.info('    Done!');

  logger.info('Parsing application group dataset...');
  const agParser = new ApplicationGroupParser(applicationEntries, includeModuleLayerLayer);
  logger.info('    Done!');

  let intParser: IntegrationParser | undefined;
  if (integrationEntries) {
    logger.info('Parsing integration dataset...');
    intParser = new IntegrationParser(integrationEntries, includeModuleLayerLayer);
    logger.info('    Done!');
  }

  logger.info('Merging datasets...');
  const mergedNodes = removeDuplicates([
    ...modDetailsParser ? modDetailsParser.nodes : [],
    ...cpParser.nodes,
    ...agParser.nodes,
    ...intParser ? intParser.nodes : [],
  ]);
  const mergedEdges = removeDuplicates([
    ...modDetailsParser ? modDetailsParser.containEdges : [],
    ...cpParser.containEdges,
    ...cpParser.dependencyEdges,
    ...agParser.containEdges,
    ...intParser ? intParser.containEdges : [],
    ...intParser ? intParser.dependencyEdges : [],
  ]);
  logger.info('    Done!');

  logger.info('Add domain to applications that have none...');
  const defaultDomainNode: Node = agParser.createDomainNode(unclassifiedDomainName);
  const applicationNodes = mergedNodes
    .filter((n) => n.data.labels.includes(GraphLayers.APPLICATION));
  const noDomainContainEdges = applicationNodes
    // Application only has incoming/outgoing dependency edges
    .filter((applicationNode) => !mergedEdges
      .find((e) => e.data.target === applicationNode.data.id))
    .map((applicationNode) => agParser.createContainEdge(defaultDomainNode, applicationNode));
  logger.info('    Done!');

  const nodes = [defaultDomainNode, ...mergedNodes];
  const edges = [...mergedEdges, ...noDomainContainEdges];

  if (modDetailsParser) {
    logger.info('Propagating module properties to parent nodes...');
    modDetailsParser.propagateModuleProperties(nodes, edges);
    logger.info('    Done!');
  }

  logger.info('Calculate metrics...');
  logger.info('  Dependency types...');
  const moduleNodes = nodes.filter((n) => n.data.labels.includes(GraphLayers.MODULE));
  new DependencyProfiles().find(moduleNodes, nodes, edges);
  logger.info('    Done!');
  logger.info('  Cohesion....');
  Cohesion.find(nodes, edges);
  logger.info('    Done!');

  return {
    elements: { nodes, edges },
  };
}
