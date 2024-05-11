import { DependencyType, RelationshipLabel } from '../structure';
import { ConsumerProducerEntry, IntegrationServiceAPIEntry } from '../input-spec';
import { consumerTypeToDependencyType } from './outsystems-arch-canvas';
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
      const prodModuleNode = this
        .getApplicationAndModule(entry.Prod_Application, entry.Prod_Module);
      const consModuleNode = this
        .getApplicationAndModule(entry.Cons_Application, entry.Cons_Module);

      const dependencyEdgeId = `${consModuleNode.data.id}__${prodModuleNode.data.id}`;
      const dependencyEdge = this.getDependencyEdge(dependencyEdgeId);

      const dependencyType = consumerTypeToDependencyType(entry.Reference_Kind);
      let nrCalls: number | undefined;
      if (dependencyType === DependencyType.RUNTIME) {
        nrCalls = 0;
        const serviceAPIEntry = filteredServiceAPIEntries
          .find((e) => e.EndpointAndMethod === entry.Reference_Name);
        if (serviceAPIEntry) {
          nrCalls = serviceAPIEntry.count;
        } else {
          nrCalls = 0;
        }
      }

      if (dependencyEdge != null) {
        if (dependencyEdge.data.properties.nrDependencies != null) {
          dependencyEdge.data.properties.nrDependencies += 1;
        }
        if (dependencyEdge.data.properties.nrCalls != null && nrCalls) {
          dependencyEdge.data.properties.nrCalls += nrCalls;
        }
        if (dependencyEdge.data.properties.references.has(entry.Reference_Kind)) {
          dependencyEdge.data.properties.references.get(entry.Reference_Kind)!
            .push(entry.Reference_Name);
        }
        dependencyEdge.data.properties.dependencyTypes?.push(dependencyType);
      } else if (dependencyEdge == null) {
        this.dependencyEdges.push({
          data: {
            id: dependencyEdgeId,
            source: consModuleNode.data.id,
            target: prodModuleNode.data.id,
            label: RelationshipLabel.CALLS,
            properties: {
              references: new Map().set(entry.Reference_Kind, [entry.Reference_Name]),
              dependencyTypes: [dependencyType],
              nrDependencies: 1,
              nrCalls,
            },
          },
        });
      }
    });

    this.dependencyEdges.forEach((e) => {
      e.data.properties.dependencyTypes = Array.from(new Set(e.data.properties.dependencyTypes));
    });
  }
}
