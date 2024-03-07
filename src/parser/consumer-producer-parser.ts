import {
  GraphLayers, Node,
} from '../structure';
import { ConsumerProducerEntry, consumerTypeToDependencyType } from './outsystems-arch-canvas';
import RootParser from './root-parser';

export default class ConsumerProducerParser extends RootParser {
  constructor(entries: ConsumerProducerEntry[], includeModuleLayerLayer: boolean) {
    super();
    entries.forEach((entry) => {
      const prodModuleNode = this.getApplicationAndModule(entry['Prod Application'], entry['Prod Espace'], includeModuleLayerLayer);
      const consModuleNode = this.getApplicationAndModule(entry['Cons Application'], entry['Cons Espace'], includeModuleLayerLayer);

      const dependencyEdgeId = `${consModuleNode.data.id}__${prodModuleNode.data.id}`;
      const dependencyEdge = this.getDependencyEdge(dependencyEdgeId);

      if (dependencyEdge != null && dependencyEdge.data.properties.weight) {
        dependencyEdge.data.properties.weight += 1;
      } else if (dependencyEdge == null) {
        this.dependencyEdges.push({
          data: {
            id: dependencyEdgeId,
            source: consModuleNode.data.id,
            target: prodModuleNode.data.id,
            label: 'calls',
            properties: {
              referenceType: entry['Reference Name'],
              dependencyType: consumerTypeToDependencyType(entry['Reference Name']),
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
