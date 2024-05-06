import {
  Edge, GraphLayers, Node, RelationshipLabel, unclassifiedDomainName,
} from '../structure';
import logger from '../logger';
import RootParser from './root-parser';
import { validateGraph } from '../graph';

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
    domainNames: string[] = [],
  ) {
    super(includeModuleLayerLayer);

    this.addNoDomainClassification();
    this.addManualModuleSublayerClassification();

    if (domainNames.length > 0) {
      this.filterGraphByDomains(domainNames);
    }

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
      // Do not anonymize the no_domain node, as it is a parser-node.
      if (n.data.properties.simpleName === unclassifiedDomainName) {
        nodeIdMapping.set(n.data.id, n.data.id);
        return n;
      }

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

      newNode.data.properties = {
        ...n.data.properties,
        simpleName: newNode.data.properties.simpleName,
        fullName: newNode.data.properties.fullName,
      };
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
        references.set(key, values.map(() => `Reference_${getIdNumber('reference')}`));
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

  private filterDuplicates<T extends Node | Edge>(e: T, index: number, all: T[]): boolean {
    return index === all.findIndex((e2) => e.data.id === e2.data.id);
  }

  /**
   * Find all leaf nodes of the given node
   * @param node
   * @private
   */
  private findLeaves(node: Node): Node[] {
    const containEdges = this.containEdges.filter((e) => e.data.label === RelationshipLabel.CONTAINS
      && e.data.source === node.data.id);
    if (containEdges.length === 0) return [node];
    const targetNodes = containEdges
      .map((e) => this.nodes.find((n) => n.data.id === e.data.target))
      .map((n) => {
        if (n === undefined) {
          throw new Error();
        }
        return n;
      });
    return targetNodes.map((n) => this.findLeaves(n)).flat();
  }

  /**
   * Find all ancestors of the given nodes (including their edges),
   * excluding the node itself.
   * @param node
   * @private
   */
  private findAncestorWithEdges(node: Node): { nodes: Node[], edges: Edge[] } {
    const containEdge = this.containEdges.find((e) => e.data.label === RelationshipLabel.CONTAINS
      && e.data.target === node.data.id);
    if (!containEdge) return { nodes: [], edges: [] };

    const parent = this.nodes.find((n) => n.data.id === containEdge.data.source);
    if (!parent) throw new Error(`Node with ID "${containEdge.data.source}" not found`);

    const { nodes, edges } = this.findAncestorWithEdges(parent);
    return { nodes: [parent, ...nodes], edges: [containEdge, ...edges] };
  }

  /**
   * Given a set of nodes, find all outgoing dependency edges and their target nodes
   * that have not been seen before.
   * @param modules
   * @param seenEdgeIds
   * @private
   */
  private findOutgoingDependenciesWithEdges(
    modules: Node[],
    seenEdgeIds: Set<string>,
  ): { nodes: Node[], edges: Edge[] } {
    const moduleIds = modules.map((n) => n.data.id);
    const dependencyEdges = this.dependencyEdges
      .filter((e) => e.data.label === RelationshipLabel.CALLS && moduleIds.includes(e.data.source))
      .filter((e) => !seenEdgeIds.has(e.data.id));

    if (dependencyEdges.length === 0) return { nodes: [], edges: [] };

    const dependencyNodes = dependencyEdges
      .map((e) => this.nodes.find((n) => n.data.id === e.data.target))
      .map((n, i) => {
        if (n === undefined) {
          throw new Error(`Node with ID "${dependencyEdges[i].data.target}" not found`);
        }
        return n;
      });
    dependencyEdges.forEach((e) => seenEdgeIds.add(e.data.id));

    const { nodes, edges } = this.findOutgoingDependenciesWithEdges(dependencyNodes, seenEdgeIds);
    return { nodes: [...dependencyNodes, ...nodes], edges: [...dependencyEdges, ...edges] };
  }

  /**
   * Given a set of nodes, find all incoming dependency edges and their target nodes
   * that have not been seen before.
   * @param modules
   * @param seenEdgeIds
   * @private
   */
  private findIncomingDependenciesWithEdges(
    modules: Node[],
    seenEdgeIds: Set<string>,
  ): { nodes: Node[], edges: Edge[] } {
    const moduleIds = modules.map((n) => n.data.id);
    const dependencyEdges = this.dependencyEdges
      .filter((e) => e.data.label === RelationshipLabel.CALLS && moduleIds.includes(e.data.target))
      .filter((e) => !seenEdgeIds.has(e.data.id));

    if (dependencyEdges.length === 0) return { nodes: [], edges: [] };

    const dependencyNodes = dependencyEdges
      .map((e) => this.nodes.find((n) => n.data.id === e.data.source))
      .map((n, i) => {
        if (n === undefined) {
          throw new Error(`Node with ID "${dependencyEdges[i].data.source}" not found`);
        }
        return n;
      });
    dependencyEdges.forEach((e) => seenEdgeIds.add(e.data.id));

    const { nodes, edges } = this.findOutgoingDependenciesWithEdges(dependencyNodes, seenEdgeIds);
    return { nodes: [...dependencyNodes, ...nodes], edges: [...dependencyEdges, ...edges] };
  }

  /**
   * Only keep the given domains and all their dependencies in the graph.
   * Delete the rest
   * @param domainNames
   * @private
   */
  private filterGraphByDomains(domainNames: string[]) {
    logger.info('Filter domains...');
    const domainIds = domainNames.map((d) => this.getDomainId(d));
    const domains = domainIds.map((d) => this.nodes.find((n) => n.data.id === d))
      .map((d, i) => {
        if (d === undefined) {
          throw new Error(`Domain with ID "${domainIds[i]}" and name "${domainNames[i]}" not found`);
        }
        return d;
      });

    logger.info('  Find all domain leaves...');
    const modules = domains.map((d) => this.findLeaves(d)).flat().filter(this.filterDuplicates);
    logger.info('    Done!');
    logger.info('  Find all nested dependencies...');
    const {
      nodes: outgoingNodes, edges: outgoingEdges,
    } = this.findOutgoingDependenciesWithEdges(modules, new Set());
    const {
      nodes: incomingNodes, edges: incomingEdges,
    } = this.findIncomingDependenciesWithEdges(modules, new Set());
    const dependencyModules = outgoingNodes.concat(incomingNodes).filter(this.filterDuplicates);
    const dependencyEdges = outgoingEdges.concat(incomingEdges).filter(this.filterDuplicates);
    logger.info('    Done!');

    logger.info('  Find all ancestors...');
    const allModules = modules.concat(dependencyModules);
    const ancestors = modules.concat(dependencyModules)
      .map((n) => this.findAncestorWithEdges(n))
      .reduce((sum, a) => ({
        nodes: sum.nodes.concat(a.nodes),
        edges: sum.edges.concat(a.edges),
      }), { nodes: [], edges: [] });
    const ancestorNodes = ancestors.nodes.filter(this.filterDuplicates);
    const containEdges = ancestors.edges.filter(this.filterDuplicates);
    logger.info('    Done!');

    this.nodes = ancestorNodes.concat(allModules).filter(this.filterDuplicates);
    this.dependencyEdges = dependencyEdges;
    this.containEdges = containEdges;
  }
}
