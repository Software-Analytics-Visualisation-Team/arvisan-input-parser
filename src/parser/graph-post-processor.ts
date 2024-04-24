import {
  Edge, GraphLayers, Node, RelationshipLabel, unclassifiedDomainName,
} from '../structure';
import logger from '../logger';
import RootParser from './root-parser';

/**
 * Parser that finalizes the given graph, such that it meets the output specification
 */
export default class GraphPostProcessor extends RootParser {
  constructor(public nodes: Node[], public containEdges: Edge[], includeModuleLayerLayer: boolean) {
    super(includeModuleLayerLayer);

    this.addNoDomainClassification();
    this.addManualModuleSublayerClassification();

    this.trim();

    const moduleNodes = this.nodes.filter((n) => n.data.labels.includes(GraphLayers.MODULE));
    this.colorNodeBasedOnParent(moduleNodes);
  }

  /**
   * Manually replace all application-module containment edges by a
   * sublayer classification of all modules by their suffix
   * @private
   */
  private addManualModuleSublayerClassification() {
    logger.info('Add modules to sublayers that have none...');

    const edgesToRemove: string[] = [];
    const moduleNodes = this.nodes.filter((n) => n.data.labels.includes(GraphLayers.MODULE));

    const sublayerContainmentEdges = moduleNodes.map((moduleNode) => {
      // Get all containment edges that have this module as its target
      const moduleContainmentEdges = this.containEdges
        .filter((e) => e.data.label === RelationshipLabel.CONTAINS
          && e.data.target === moduleNode.data.id);

      // Only keep the containment edges that have an application node as its source.
      const applicationModuleEdges = moduleContainmentEdges.filter((e) => {
        const source = this.nodes.find((n) => n.data.id === e.data.source);
        if (!source) {
          throw new Error(`Source node with ID "${e.data.source}" of edge "${e.data.id}" not found.`);
        }
        return source.data.labels.includes(GraphLayers.APPLICATION);
      });
      // We need to remove these edges from the graph later, because they violate
      // the output specification.
      edgesToRemove.push(...applicationModuleEdges.map((e) => e.data.id));

      // If some edges are removed from the applicationModuleEdges array, then those
      // edges must be sublayer containment edges.
      const nrSublayerEdges = moduleContainmentEdges.length - applicationModuleEdges.length;

      if (nrSublayerEdges > 1) {
        // We cannot have more than 1. If so, something went wrong earlier.
        throw new Error(`Found "${nrSublayerEdges}" sublayer containment edges for module ${moduleNode.data.id}, which should not be possible.`);
      } else if (nrSublayerEdges === 1) {
        // We already have a sublayer edge, so no need to create a new one.
        return undefined;
      }

      // No sublayer edge has been found, so we need to create one
      const {
        layer: moduleLayer, sublayer: moduleSublayer,
      } = this.moduleSuffixToLayers(moduleNode.data.properties.simpleName);
      const applicationId = moduleContainmentEdges[0].data.source;
      const sublayerNodeId = this.getApplicationWithSublayerId(
        applicationId,
        moduleLayer,
        moduleSublayer,
      );
      const sublayerNode = this.getNode(sublayerNodeId);
      if (!sublayerNode) {
        throw new Error(`Sublayer node with ID "${sublayerNodeId}" not found.`);
      }

      return this.createContainEdge(sublayerNode, moduleNode);
    }).filter((e) => e !== undefined)
      .map((e) => e!);
    logger.info('    Done!');

    logger.info('Replace application containment edges by sublayer containment edges...');
    this.containEdges = this.containEdges
      .filter((e) => !edgesToRemove.includes(e.data.id))
      .concat(sublayerContainmentEdges);

    logger.info('    Done!');
  }

  /**
   * Assign every application node that does not have a domain parent
   * to the "no_domain" domain.
   * @private
   */
  private addNoDomainClassification() {
    logger.info('Add domain to applications that have none...');

    const defaultDomainNode: Node = this.createDomainNode(unclassifiedDomainName);
    const applicationNodes = this.nodes
      .filter((n) => n.data.labels.includes(GraphLayers.APPLICATION));
    // Find all applications that have no incoming containment edges
    const noDomainContainEdges = applicationNodes
      .filter((applicationNode) => !this.containEdges
        .find((e) => e.data.target === applicationNode.data.id))
      .map((applicationNode) => this.createContainEdge(defaultDomainNode, applicationNode));

    this.nodes.unshift(defaultDomainNode);
    this.containEdges = this.containEdges.concat(noDomainContainEdges);

    logger.info('    Done!');
  }
}
