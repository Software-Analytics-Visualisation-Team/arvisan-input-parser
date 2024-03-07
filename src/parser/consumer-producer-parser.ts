import {
  CoreLayerSublayers,
  EndUserLayerSublayers, FoundationLayerSublayers,
  GraphLayers, ModuleLayers, ModuleSublayer, Node,
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

  /**
   * Given a application with one of its module, return any new application nodes,
   * module nodes, and (sub)layer nodes with their containment edges
   * @param applicationName
   * @param moduleName
   * @param includeModuleLayerLayer
   * @private
   * @returns Module node
   */
  private getApplicationAndModule(
    applicationName: string,
    moduleName: string,
    includeModuleLayerLayer: boolean,
  ): Node {
    const appId = this.getApplicationId(applicationName);
    let appNode = this.getNode(appId);
    if (!appNode) {
      appNode = this.createApplicationNode(applicationName);
      const {
        nodes: layerNodes, edges: layerEdges,
      } = this.getApplicationModuleLayerNodesAndEdges([appNode], includeModuleLayerLayer);
      this.nodes.push(appNode, ...layerNodes);
      this.containEdges.push(...layerEdges);
    }

    const moduleId = this.getModuleId(applicationName, moduleName);
    let moduleNode = this.getNode(moduleId);
    if (!moduleNode) {
      moduleNode = this.createModuleNode(applicationName, moduleName);

      const {
        layer: moduleLayer,
        sublayer: moduleSublayer,
      } = this.moduleSuffixToLayers(moduleName);
      const parentId = this.getApplicationWithSublayerId(appId, moduleLayer, moduleSublayer);
      const parentNode = this.getNode(parentId);
      if (!parentNode) {
        throw new Error(`Parent node with ID ${parentId} not found.`);
      }

      const containsEdge = this.createContainEdge(parentNode, moduleNode);

      this.nodes.push(moduleNode);
      this.containEdges.push(containsEdge);
    }

    return moduleNode;
  }

  /**
   * Given the name of a module, extract the type of module based on its extension
   * If no explicit defined extension, the module will be of layer Enduser
   * @param moduleName
   */
  private moduleSuffixToLayers(moduleName: string): {
    layer: ModuleLayers, sublayer: ModuleSublayer,
  } {
    const suffix = moduleName.split('_').pop()?.toLowerCase();
    switch (suffix) {
      case 'api':
        return { layer: ModuleLayers.CORE, sublayer: CoreLayerSublayers.API };
      case 'cw':
        return { layer: ModuleLayers.CORE, sublayer: CoreLayerSublayers.CORE_WIDGETS };
      case 'cs':
        return { layer: ModuleLayers.CORE, sublayer: CoreLayerSublayers.CORE_SERVICE };
      case 'bl':
        return { layer: ModuleLayers.CORE, sublayer: CoreLayerSublayers.COMPOSITE_LOGIC };
      case 'theme':
      case 'thm':
      case 'th':
        return { layer: ModuleLayers.FOUNDATION, sublayer: FoundationLayerSublayers.STYLE_GUIDE };
      case 'is':
        return {
          layer: ModuleLayers.FOUNDATION,
          sublayer: FoundationLayerSublayers.FOUNDATION_SERVICE,
        };
      case 'lib':
        return { layer: ModuleLayers.FOUNDATION, sublayer: FoundationLayerSublayers.LIBRARY };
      default: break;
    }

    const prefix = moduleName.split('_').shift()?.toLowerCase();
    switch (prefix) {
      case 'cdm':
        return { layer: ModuleLayers.FOUNDATION, sublayer: FoundationLayerSublayers.LIBRARY };
      default: break;
    }

    return { layer: ModuleLayers.END_USER, sublayer: EndUserLayerSublayers.END_USER };
  }

  /**
   * Color the child nodes based on what "contain" edge they have.
   * @param childNodes
   */
  private colorNodeBasedOnParent(childNodes: Node[]): void {
    childNodes.forEach((moduleNode) => {
      const containEdge = this.containEdges.find((e) => e.data.target === moduleNode.data.id && e.data.label === 'contains');
      if (!containEdge) return;

      const parentNode = this.nodes.find((n) => n.data.id === containEdge.data.source);
      if (!parentNode) return;

      // eslint-disable-next-line no-param-reassign
      moduleNode.data.properties.color = parentNode.data.properties.color;
    });
  }
}
