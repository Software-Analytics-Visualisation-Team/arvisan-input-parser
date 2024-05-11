import RootParser from './root-parser';
import { ModuleDetailsEntry } from '../input-spec';
import {
  Edge, Node, NodePropertiesDetails, optionalModuleProperties, RelationshipLabel,
} from '../structure';

export default class ModuleDetailsParser extends RootParser {
  /**
   * Given a node in the graph, get a list of all modules it contains.
   * If the node itself is a module, it itself is returned.
   * @param node
   * @param allNodes
   * @param allContainEdges
   * @private
   */
  private getModules(node: Node, allNodes: Node[], allContainEdges: Edge[]): Node[] {
    const containEdges = allContainEdges.filter((e) => e.data.source === node.data.id);
    // Node does not have any containment edges, so this node is a module.
    if (containEdges.length === 0) {
      return [node];
    }

    const childIds = containEdges.map((e) => e.data.target);
    const children = allNodes.filter((n) => childIds.includes(n.data.id));

    return children.reduce((modules: Node[], child) => modules
      .concat(this.getModules(child, allNodes, allContainEdges)), []);
  }

  /**
   * Return the sum of the given property of all given nodes.
   * If the value is undefined for all nodes, return undefined.
   * If the value is a string or undefined for some nodes, it counts as zero.
   * @param nodes List of nodes to sum
   * @param property Name of numerical node property
   * @private
   */
  private getNumericalSumProperty(
    nodes: Node[],
    property: keyof NodePropertiesDetails,
  ): number | undefined {
    // TODO: fix dataset so all modules are contained in the "Module details" datasets
    // const values = nodes.map((n) => n.data.properties[property]);
    // if (values.every((v) => v === undefined)) return undefined;

    return nodes.reduce((total, n) => {
      const value = n.data.properties[property];
      if (value === undefined) return total;
      return total + value;
    }, 0);
  }

  constructor(entries: ModuleDetailsEntry[], includeModuleLayerLayer: boolean) {
    super(includeModuleLayerLayer);

    entries.forEach((e) => {
      const moduleNode = this.getApplicationAndModule(e.ApplicationName, e.ModuleName);

      moduleNode.data.properties.fileSizeKB = e.FileSizeKB;
      moduleNode.data.properties.nrScreens = e.Count_Screens;
      moduleNode.data.properties.nrEntities = e.Count_Entities;
      moduleNode.data.properties.nrPublicElements = e.Count_PublicElements;
      moduleNode.data.properties.nrRESTConsumers = e.Count_REST_Consumer;
      moduleNode.data.properties.nrRESTProducers = e.Count_REST_Producer;
    });
  }

  /**
   * Propagate numerical module properties to their respective parent nodes by summing them up.
   * @param nodes
   * @param edges List of edges. Internally filtered to only use CONTAINS edges
   */
  public propagateModuleProperties(nodes: Node[], edges: Edge[]) {
    const containEdges = edges.filter((e) => e.data.label === RelationshipLabel.CONTAINS);

    // Naive approach; it would be faster to start at the top layer and recursively propagate
    // from the bottom to the top. However, for now this is easier and fast enough.
    nodes.forEach((n) => {
      const modules = this.getModules(n, nodes, containEdges);
      optionalModuleProperties.forEach((property) => {
        // eslint-disable-next-line no-param-reassign
        n.data.properties[property] = this.getNumericalSumProperty(modules, property);
      });
    });
  }
}
