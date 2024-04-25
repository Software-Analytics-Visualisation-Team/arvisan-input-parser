import {
  Edge, GraphLayers, Node, RelationshipLabel, unclassifiedDomainName,
} from '../structure';
import logger from '../logger';
import RootParser from './root-parser';

/**
 * Parser that finalizes the given graph, such that it meets the output specification
 */
export default class GraphPostProcessor extends RootParser {
  constructor(
    public nodes: Node[],
    public containEdges: Edge[],
    public dependencyEdges: Edge[],
    includeModuleLayerLayer: boolean,
    anonymize: boolean,
  ) {
    super(includeModuleLayerLayer);

    this.addNoDomainClassification();
    this.addManualModuleSublayerClassification();

    if (anonymize) {
      this.anonymizeGraph();
    }

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

  /**
   * Anonymize the graph by replacing all node/edge names.
   * Note that this is a destructive operation, which makes it impossible
   * to match this graph with any other graphs.
   * Nodes will get a counter as name and ID.
   * Edges will get a random UUID as ID.
   */
  private anonymizeGraph() {
    const counters: { [key in GraphLayers]: number } = {
      [GraphLayers.DOMAIN]: 0,
      [GraphLayers.APPLICATION]: 0,
      [GraphLayers.LAYER]: 0,
      [GraphLayers.SUB_LAYER]: 0,
      [GraphLayers.MODULE]: 0,
    };
    let referenceCounter = 1;

    const getIdNumber = (layer: GraphLayers | 'reference') => {
      if (layer === 'reference') {
        referenceCounter += 1;
        return referenceCounter;
      }
      counters[layer] += 1;
      return counters[layer];
    };

    // Sanity runtime check that every layer has a counter
    if (Object.keys(GraphLayers).length !== Object.keys(counters).length) {
      throw new Error('Missing some counter keys.');
    }

    // Mapping from old node ID to new node ID
    const nodeIdMapping = new Map<string, string>();

    this.nodes = this.nodes.map((n) => {
      const [label] = n.data.labels;
      let newNode: Node;
      switch (label) {
        case GraphLayers.DOMAIN:
          newNode = this.createDomainNode(`Domain_${getIdNumber(label)}`);
          break;
        case GraphLayers.APPLICATION:
          newNode = this.createApplicationNode(`Application_${getIdNumber(label)}`);
          break;
        case GraphLayers.MODULE:
          newNode = this.createModuleNode('', `Module_${getIdNumber(label)}`);
          break;
        case GraphLayers.LAYER:
        case GraphLayers.SUB_LAYER:
          return n;
        default:
          throw new Error(`Unknown graph layer: ${label}`);
      }

      nodeIdMapping.set(n.data.id, newNode.data.id);
      return newNode;
    }).map((n) => {
      const [label] = n.data.labels;
      let newNode: Node;
      let newNodeId: string;
      let applicationId: string;
      switch (label) {
        case GraphLayers.DOMAIN:
        case GraphLayers.APPLICATION:
        case GraphLayers.MODULE:
          // Already anonymized
          return n;
        case GraphLayers.LAYER:
          applicationId = this.getApplicationIdFromLayer(n.data.id);
          newNodeId = `Layer_${getIdNumber(label)}`;
          newNode = {
            data: {
              id: newNodeId,
              labels: n.data.labels,
              properties: {
                ...n.data.properties,
                fullName: `${nodeIdMapping.get(applicationId) ?? ''} ${newNodeId}`.trim(),
                simpleName: newNodeId,
              },
            },
          };
          break;
        case GraphLayers.SUB_LAYER:
          applicationId = this.getApplicationIdFromLayer(n.data.id);
          newNodeId = `Sublayer_${getIdNumber(label)}`;
          newNode = {
            data: {
              id: newNodeId,
              labels: n.data.labels,
              properties: {
                ...n.data.properties,
                fullName: `${nodeIdMapping.get(applicationId) ?? ''} ${newNodeId}`.trim(),
                simpleName: newNodeId,
              },
            },
          };
          break;
        default:
          throw new Error(`Unknown graph layer: ${label}`);
      }

      nodeIdMapping.set(n.data.id, newNode.data.id);
      return newNode;
    });

    const anonymizeEdge = (e: Edge): Edge => {
      const source = nodeIdMapping.get(e.data.source);
      const target = nodeIdMapping.get(e.data.target);
      if (!source || !target) throw new Error('Edge source or target not found.');

      const references = new Map<string, string[]>();
      e.data.properties.references.forEach((values, key) => {
        references.set(key, values.map((v) => `Reference_${getIdNumber('reference')}`));
      });

      return {
        data: {
          id: `${source}__${target}`,
          source,
          target,
          label: e.data.label,
          properties: {
            ...e.data.properties,
            references,
          },
        },
      };
    };

    this.containEdges = this.containEdges.map(anonymizeEdge);
    this.dependencyEdges = this.dependencyEdges.map(anonymizeEdge);
  }
}
