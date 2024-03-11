import { DependencyType, GraphLayers } from '../structure';
import {
  ConsumerProducerEntry,
  consumerTypeToDependencyType,
  IntegrationServiceAPIEntry,
} from './outsystems-arch-canvas';
import RootParser from './root-parser';

export default class ConsumerProducerParser extends RootParser {
  constructor(
    consumerProducerEntries: ConsumerProducerEntry[],
    includeModuleLayerLayer: boolean,
    serviceAPIEntries: IntegrationServiceAPIEntry[] = [],
  ) {
    super(includeModuleLayerLayer);

    const filteredServiceAPIEntries = serviceAPIEntries.filter((e) => e.logtype === 'ServiceAPI');

    consumerProducerEntries.forEach((entry) => {
      const prodModuleNode = this.getApplicationAndModule(entry['Prod Application'], entry['Prod Espace']);
      const consModuleNode = this.getApplicationAndModule(entry['Cons Application'], entry['Cons Espace']);

      const dependencyEdgeId = `${consModuleNode.data.id}__${prodModuleNode.data.id}`;
      const dependencyEdge = this.getDependencyEdge(dependencyEdgeId);

      if (dependencyEdge != null && dependencyEdge.data.properties.nrDependencies) {
        dependencyEdge.data.properties.nrDependencies += 1;
      } else if (dependencyEdge == null) {
        const dependencyType = consumerTypeToDependencyType(entry['Reference Name']);

        let nrCalls: number | undefined;
        if (dependencyType === DependencyType.WEAK) {
          nrCalls = 0;
          const serviceAPIEntry = filteredServiceAPIEntries.find((e) => e.EndpointAndMethod === entry['Reference Kind']);
          if (serviceAPIEntry) {
            nrCalls = serviceAPIEntry.count;
          } else {
            nrCalls = 0;
          }
        }

        this.dependencyEdges.push({
          data: {
            id: dependencyEdgeId,
            source: consModuleNode.data.id,
            target: prodModuleNode.data.id,
            label: 'calls',
            properties: {
              referenceType: entry['Reference Name'],
              referenceName: entry['Reference Kind'],
              dependencyType,
              nrDependencies: 1,
              nrCalls,
            },
          },
        });
      }
    });

    this.trim();

    const moduleNodes = this.nodes.filter((n) => n.data.labels.includes(GraphLayers.MODULE));
    this.colorNodeBasedOnParent(moduleNodes);
  }
}
