import { read, readFile, utils } from 'xlsx';
import {
  Edge, Graph, GraphLayers, Node,
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
import GraphPostProcessor from './graph-post-processor';

function removeDuplicates<T extends Node | Edge>(elements: T[]) {
  const seenElements = new Set<string>();
  return elements.filter((n) => {
    if (seenElements.has(n.data.id)) return false;
    seenElements.add(n.data.id);
    return true;
  });
}

/**
 * Parse the given files to a Neo4j / Cytoscape graph object
 * @param structureFiles Files containing the structure of the landscape
 * (domains, applications, sublayers, and modules).
 * @param dependencyFiles One or more files containing consumers and producers.
 * @param integrationFile Optional file containing dynamic data about integrations and service APIs.
 * @param detailsFiles Optional one or more files containing more details about modules.
 * @param includeModuleLayerLayer Whether the "Layer" layer from the OutSystems Architecture Canvas
 * should be included in the resulting graph
 * @param anonymize Whether the output graph should be anonymized
 */
export default function getGraph(
  structureFiles: Buffer[],
  dependencyFiles: Buffer[],
  integrationFile?: Buffer,
  detailsFiles: Buffer[] = [],
  includeModuleLayerLayer = false,
  anonymize = false,
): Graph {
  logger.info('Parsing files...');

  const applicationWorkbooks = structureFiles.map((file) => read(file));
  const applicationEntries: ApplicationGroupEntry[] = applicationWorkbooks
    .map((workbook): ApplicationGroupEntry[] => utils
      .sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]))
    .flat();

  const consumerProducerWorkbooks = dependencyFiles.map((file) => read(file));
  const consumerProducerEntries = consumerProducerWorkbooks
    .map((workbook): ConsumerProducerEntry[] => utils
      .sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]))
    .flat();

  const dynamicDataWorkbook = integrationFile ? read(integrationFile) : undefined;
  const dynamicDataEntries: IntegrationServiceAPIEntry[] | undefined = dynamicDataWorkbook ? utils
    .sheet_to_json(dynamicDataWorkbook.Sheets[dynamicDataWorkbook.SheetNames[0]]) : undefined;
  const integrationEntries = dynamicDataEntries ? dynamicDataEntries.filter((e) => e.logtype === 'Integration') : undefined;
  const serviceAPIEntries = dynamicDataEntries ? dynamicDataEntries.filter((e) => e.logtype === 'ServiceAPI') : undefined;

  const moduleDetailsWorkbooks = detailsFiles.map((file) => read(file));
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
  const mergedNodes = removeDuplicates(
    (modDetailsParser ? modDetailsParser.nodes : [])
      .concat(cpParser.nodes)
      .concat(agParser.nodes)
      .concat(intParser ? intParser.nodes : []),
  );
  const mergedContainEdges = removeDuplicates(
    (modDetailsParser ? modDetailsParser.containEdges : [])
      .concat(cpParser.containEdges)
      .concat(agParser.containEdges)
      .concat(intParser ? intParser.containEdges : []),
  );
  const mergedDependencyEdges = removeDuplicates(
    cpParser.dependencyEdges
      .concat(intParser ? intParser.dependencyEdges : []),
  );
  logger.info('    Done!');

  const postProcessor = new GraphPostProcessor(
    mergedNodes,
    mergedContainEdges,
    mergedDependencyEdges,
    includeModuleLayerLayer,
    anonymize,
  );

  const { nodes } = postProcessor;
  const edges = postProcessor.containEdges.concat(postProcessor.dependencyEdges);

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
