import {
  CoreLayerSublayers,
  Edge,
  EndUserLayerSublayers,
  formatName,
  formatName as format, FoundationLayerSublayers, Graph,
  GraphLayers,
  moduleColors,
  ModuleLayers,
  ModuleSublayer,
  Node,
} from '../structure';

export default class RootParser {
  public nodes: Node[] = [];

  public containEdges: Edge[] = [];

  public dependencyEdges: Edge[] = [];

  public getNode(id: string) {
    return this.nodes.find((n) => n.data.id === id);
  }

  public getDependencyEdge(id: string) {
    return this.dependencyEdges.find((e) => e.data.id === id);
  }

  public getDomainId(domainName: string) {
    return format(`D_${domainName}`);
  }

  protected getApplicationId(applicationName: string) {
    return format(`A_${applicationName}`);
  }

  protected getApplicationWithLayersId(
    applicationName: string,
    layer?: ModuleLayers,
    sublayer?: ModuleSublayer,
  ) {
    if (!layer || !sublayer) return this.getApplicationId(applicationName);
    return format(`A_${applicationName}__${layer}_${sublayer}`);
  }

  protected getModuleId(applicationName: string, moduleName: string) {
    return format(`A_${applicationName}__M_${moduleName}`);
  }

  /**
   * Create a domain node
   * @param domainName
   */
  public createDomainNode(domainName: string): Node {
    // If this entry is empty, skip this entry
    if (domainName === '') throw new Error('No domain name defined');

    // Create the ID. Skip this entry if the node already exists
    const id = this.getDomainId(domainName);

    return {
      data: {
        id,
        properties: {
          fullName: id,
          simpleName: domainName,
          color: '#7B7D7D',
          depth: 1,
        },
        labels: [GraphLayers.DOMAIN],
      },
    };
  }

  /**
   * Create an application node
   * @param applicationName
   */
  protected createApplicationNode(applicationName: string): Node {
    // If this entry is empty, skip this entry
    if (applicationName === '') throw new Error('No application name defined');

    // Create the ID. Skip this entry if the node already exists
    const id = this.getApplicationId(applicationName);

    return {
      data: {
        id,
        properties: {
          fullName: id,
          simpleName: applicationName,
          color: '#7B7D7D',
          depth: 1,
        },
        labels: [GraphLayers.APPLICATION],
      },
    };
  }

  /**
   * Create a module node
   * @param applicationName
   * @param moduleName
   */
  protected createModuleNode(applicationName: string, moduleName: string): Node {
    // If this entry is empty, skip this entry
    if (moduleName === '') throw new Error('No module name defined');

    // Create the ID. Skip this entry if the node already exists
    const id = this.getModuleId(applicationName, moduleName);

    return {
      data: {
        id,
        properties: {
          fullName: id,
          simpleName: moduleName,
          color: '#7B7D7D',
          depth: 4,
        },
        labels: [GraphLayers.MODULE],
      },
    };
  }

  /**
   * Create a set of layer and sublayer nodes for each application node
   * @param applicationNodes
   * @param includeModuleLayerLayer Whether a fifth layer between application and sublayer
   * (namely Layer) should be included in the resulting graph
   */
  protected getApplicationModuleLayerNodesAndEdges(
    applicationNodes: Node[],
    includeModuleLayerLayer = false,
  ) {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    applicationNodes.forEach((applicationNode) => {
      Object.values(ModuleLayers).forEach((layer) => {
        let layerNode: Node | undefined;
        if (includeModuleLayerLayer) {
          layerNode = {
            data: {
              id: formatName(`${applicationNode.data.id}__${layer}`),
              properties: {
                fullName: `Layer_${layer}`,
                simpleName: layer,
                color: moduleColors[layer],
                depth: 3,
              },
              labels: [`layer_${layer}`, GraphLayers.LAYER],
            },
          };
          const layerEdge: Edge = {
            data: {
              id: formatName(`${applicationNode.data.id}__${layer}__contains`),
              source: applicationNode.data.id,
              target: layerNode.data.id,
              properties: {
                referenceType: 'Contains',
              },
              label: 'contains',
            },
          };
          nodes.push(layerNode);
          edges.push(layerEdge);
        }

        let subLayerKeys: string[];
        switch (layer) {
          case ModuleLayers.END_USER: subLayerKeys = Object.values(EndUserLayerSublayers); break;
          case ModuleLayers.CORE: subLayerKeys = Object.values(CoreLayerSublayers); break;
          case ModuleLayers.FOUNDATION:
            subLayerKeys = Object.values(FoundationLayerSublayers);
            break;
          default: subLayerKeys = []; break;
        }

        const subLayerNodes: Node[] = [];
        const subLayerEdges: Edge[] = [];
        subLayerKeys.forEach((subLayer) => {
          const subLayerNode: Node = ({
            data: {
              id: formatName(`${applicationNode.data.id}__${layer}_${subLayer}`),
              properties: {
                fullName: `Sublayer_${subLayer}`,
                simpleName: subLayer,
                color: moduleColors[layer],
                depth: 3,
              },
              labels: [`Sublayer_${subLayer}`, GraphLayers.SUB_LAYER],
            },
          });

          const subLayerEdge: Edge = ({
            data: {
              id: formatName(`${applicationNode.data.id}__${layer}_${subLayer}__contains`),
              source: layerNode ? layerNode.data.id : applicationNode.data.id,
              target: subLayerNode.data.id,
              properties: {
                referenceType: 'Contains',
              },
              label: 'contains',
            },
          });

          subLayerNodes.push(subLayerNode);
          subLayerEdges.push(subLayerEdge);
        });

        nodes.push(...subLayerNodes);
        edges.push(...subLayerEdges);
      });
    });

    return { nodes, edges };
  }

  /**
   * Create a containment edge from source to target
   * @param source
   * @param target
   * @protected
   */
  public createContainEdge(source: Node, target: Node): Edge {
    return {
      data: {
        id: `${source.data.id}__${target.data.id}`,
        source: source.data.id,
        target: target.data.id,
        label: 'contains',
        properties: {
          referenceType: 'Contains',
        },
      },
    };
  }

  /**
   * Trim the parser's of nodes and containment edges of (sub)layer nodes without any children
   */
  public trim(): { filteredNodes: Node[], filteredEdges: Edge[] } {
    /*
     * Trim sublayer nodes
     */
    let filteredNodes = this.nodes.filter((n) => {
      if (!n.data.labels.includes(GraphLayers.SUB_LAYER)) return true;
      // SubLayer node contains at least one module. If not, remove the node.
      return this.containEdges.some((e) => e.data.source === n.data.id);
    });
    let filteredEdges = this.containEdges.filter((e) => filteredNodes
      // All contain edges have a target node. We are specifically looking for nodes
      // that have a SubLayer-node as target, because we might have removed that node
      // just now.
      .some((n) => n.data.id === e.data.target));

    /*
     * Trim layer nodes (same methodology as above)
     */
    filteredNodes = filteredNodes.filter((n) => {
      if (!n.data.labels.includes(GraphLayers.LAYER)) return true;
      return filteredEdges.some((e) => e.data.source === n.data.id);
    });
    filteredEdges = filteredEdges.filter((e) => filteredNodes
      .some((n) => n.data.id === e.data.target));

    this.nodes = filteredNodes;
    this.containEdges = filteredEdges;

    return { filteredNodes, filteredEdges };
  }
}
