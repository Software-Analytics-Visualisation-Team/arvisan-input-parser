import {
  Edge, GraphLayers, Node,
} from '../structure';
import { ConsumerProducerEntry, consumerTypeToDependencyType } from './outsystems-arch-canvas';
import RootParser from './root-parser';

export default class ConsumerProducerParser extends RootParser {
  constructor(entries: ConsumerProducerEntry[], includeModuleLayerLayer: boolean) {
    super();
    entries.forEach((entry) => {
      const {
        newNodes: prodNewNodes, newEdges: prodNewEdges, moduleNode: prodModuleNode,
      } = this.getApplicationAndModule(entry['Prod Application'], entry['Prod Espace'], includeModuleLayerLayer);
      const {
        newNodes: consNewNodes, newEdges: consNewEdges, moduleNode: consModuleNode,
      } = this.getApplicationAndModule(entry['Cons Application'], entry['Cons Espace'], includeModuleLayerLayer);

      this.nodes.push(...prodNewNodes, ...consNewNodes);
      this.containEdges.push(...prodNewEdges, ...consNewEdges);

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

  /**
   * Given a application with one of its module, return any new application nodes,
   * module nodes, and (sub)layer nodes with their containment edges
   * @param applicationName
   * @param moduleName
   * @param includeModuleLayerLayer
   * @private
   */
  private getApplicationAndModule(
    applicationName: string,
    moduleName: string,
    includeModuleLayerLayer: boolean,
  ): {
      newNodes: Node[], newEdges: Edge[], moduleNode: Node,
    } {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const appId = this.getApplicationId(applicationName);
    let appNode = this.getNode(appId);
    if (!appNode) {
      appNode = this.createApplicationNode(applicationName);
      const {
        nodes: layerNodes, edges: layerEdges,
      } = this.getApplicationModuleLayerNodesAndEdges([appNode], includeModuleLayerLayer);
      newNodes.push(appNode, ...layerNodes);
      newEdges.push(...layerEdges);
    }

    const moduleId = this.getModuleId(applicationName, moduleName);
    let moduleNode = this.getNode(moduleId);
    if (!moduleNode) {
      moduleNode = this.createModuleNode(applicationName, moduleName);
      const containsEdge = this.createContainEdge(appNode, moduleNode);
      newNodes.push(moduleNode);
      newEdges.push(containsEdge);
    }

    return { newNodes, newEdges, moduleNode };
  }

  /**
   * Color the child nodes based on what "contain" edge they have.
   * @param childNodes
   */
  private colorNodeBasedOnParent(childNodes: Node[]): Node[] {
    return childNodes.map((moduleNode) => {
      const containEdge = this.containEdges.find((e) => e.data.target === moduleNode.data.id && e.data.label === 'contains');
      if (!containEdge) return moduleNode;

      const parentNode = this.nodes.find((n) => n.data.id === containEdge.data.source);
      if (!parentNode) return moduleNode;

      return {
        ...moduleNode,
        data: {
          ...moduleNode.data,
          properties: {
            ...moduleNode.data.properties,
            color: parentNode.data.properties.color,
          },
        },
      } as Node;
    });
  }
}
