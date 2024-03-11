import RootParser from './root-parser';
import { IntegrationServiceAPIEntry } from './outsystems-arch-canvas';
import { DependencyType, GraphLayers } from '../structure';

export default class IntegrationParser extends RootParser {
  /**
   * @param entries List of integrations
   * @param includeModuleLayerLayer
   */
  constructor(entries: IntegrationServiceAPIEntry[], includeModuleLayerLayer: boolean) {
    super();

    const integrations = entries.filter((e) => e.logtype === 'Integration');

    // Group all consumer or producer entries with the same method name together.
    // This assumes that consumer and producer use the same endpoint and method name
    // for such integration calls.
    const integrationsUniqueEndpointAndMethods = entries
      .map((e) => e.EndpointAndMethod)
      .filter((x, i, all) => i === all.findIndex((x2) => x === x2));
    const groupedIntegrations = integrationsUniqueEndpointAndMethods
      .map((method) => integrations.filter((e) => e.EndpointAndMethod === method));

    // Each set of entries needs to contain exactly one producer and at least one consumer
    const validGroupedIntegrations = groupedIntegrations.filter((group) => {
      const hasConsumer = group.some((e) => e.direction === 'REST (Consume)');
      const hasOneProducer = group.filter((e) => e.direction === 'REST (Expose)').length === 1;
      return hasConsumer && hasOneProducer;
    });

    validGroupedIntegrations
      .forEach((group) => this.parseGroupedIntegration(group, includeModuleLayerLayer));

    this.trim();

    const moduleNodes = this.nodes.filter((n) => n.data.labels.includes(GraphLayers.MODULE));
    this.colorNodeBasedOnParent(moduleNodes);
  }

  /**
   * Parse a set of integrations that likely belong together as a set of dependencies
   * @param group
   * @param includeModuleLayerLayer
   * @private
   */
  private parseGroupedIntegration(
    group: IntegrationServiceAPIEntry[],
    includeModuleLayerLayer: boolean,
  ) {
    const producer = group.find((e) => e.direction === 'REST (Expose)');
    if (producer === undefined) throw new Error('Producer not found');
    const consumers = group.filter((e) => e.direction === 'REST (Consume)');

    const prodModuleNode = this.getApplicationAndModule(
      producer.ApplicationName,
      producer.ModuleName,
      includeModuleLayerLayer,
    );

    consumers.forEach((consumer) => {
      const consModuleNode = this.getApplicationAndModule(
        consumer.ApplicationName,
        consumer.ModuleName,
        includeModuleLayerLayer,
      );

      const dependencyEdgeId = `${consModuleNode.data.id}__${prodModuleNode.data.id}`;
      const dependencyEdge = this.getDependencyEdge(dependencyEdgeId);

      if (dependencyEdge != null) {
        if (dependencyEdge.data.properties.nrDependencies != null) {
          dependencyEdge.data.properties.nrDependencies += 1;
        }
        if (dependencyEdge.data.properties.nrCalls != null) {
          dependencyEdge.data.properties.nrCalls += consumer.count;
        }
      } else {
        this.dependencyEdges.push({
          data: {
            id: dependencyEdgeId,
            source: consModuleNode.data.id,
            target: prodModuleNode.data.id,
            label: 'calls',
            properties: {
              referenceType: consumer.EndpointAndMethod,
              dependencyType: DependencyType.WEAK,
              nrDependencies: 1,
              nrCalls: consumer.count,
            },
          },
        });
      }
    });
  }
}
