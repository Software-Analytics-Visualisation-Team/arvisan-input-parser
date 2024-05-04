import { Edge, ModuleLayers, ModuleSublayer, Node } from '../structure';
interface LayerResult {
    layer: ModuleLayers;
    sublayer: ModuleSublayer;
}
export default class RootParser {
    protected includeModuleLayerLayer: boolean;
    nodes: Node[];
    containEdges: Edge[];
    dependencyEdges: Edge[];
    /**
     * @param includeModuleLayerLayer Whether a fifth layer between application and sublayer
     * (namely Layer) should be included in the resulting graph
     */
    constructor(includeModuleLayerLayer: boolean);
    getNode(id: string): Node | undefined;
    getDependencyEdge(id: string): Edge | undefined;
    getDomainId(domainName: string): string;
    protected getApplicationId(applicationName: string): string;
    protected getApplicationWithLayerId(applicationId: string, layer?: ModuleLayers | string): string;
    /**
     * Get the ID of the parent node that belongs to the given application
     * @param applicationId
     * @param layer
     * @param sublayer
     * @protected
     */
    protected getApplicationWithSublayerId(applicationId: string, layer?: ModuleLayers | string, sublayer?: ModuleSublayer | string): string;
    /**
     * Revert the mapping done by getApplicationWithSublayerId and getApplicationWithLayerId
     * to extract only the application ID
     * @param layerId
     * @protected
     */
    protected getApplicationIdFromLayer(layerId: string): string;
    protected getModuleId(applicationName: string, moduleName: string): string;
    /** Convert a string to pascal case (upper camel case) */
    private pascalize;
    /**
     * Given the sublayer name, return its layer and sublayer references for processing
     * @param sublayerName
     * @private
     */
    private sublayerNameToLayers;
    /**
     * Given the name of a module, extract the type of module based on its extension
     * If no explicit defined extension, the module will be of layer Enduser
     * @param moduleName
     */
    protected moduleSuffixToLayers(moduleName: string): LayerResult;
    /**
     * Create a domain node
     * @param domainName
     */
    createDomainNode(domainName: string): Node;
    /**
     * Create an application node
     * @param applicationName
     */
    protected createApplicationNode(applicationName: string): Node;
    /**
     * Create a module node
     * @param applicationName
     * @param moduleName
     */
    protected createModuleNode(applicationName: string, moduleName: string): Node;
    /**
     * Create a set of layer and sublayer nodes for each application node
     * @param applicationNodes
     */
    protected getApplicationModuleLayerNodesAndEdges(applicationNodes: Node[]): {
        nodes: Node[];
        edges: Edge[];
    };
    /**
     * Create a containment edge from source to target
     * @param source
     * @param target
     * @protected
     */
    createContainEdge(source: Node, target: Node): Edge;
    /**
     * Remove nodes and containment edges of (sub)layer nodes without any children in-place.
     * @returns new set of nodes and containment edges.
     */
    trim(): {
        filteredNodes: Node[];
        filteredEdges: Edge[];
    };
    /**
     * Given a application with one of its module, return any new application nodes,
     * module nodes, and (sub)layer nodes with their containment edges. If no
     * sublayerName is provided, a containment edge will be added between the
     * application and the module.
     * @param applicationName Name of the application
     * @param moduleName Name of the module
     * @param domainNode Optional domain node belonging to this application/module
     * @param sublayerName Optional name of the sublayer to create a sublayer containment edge
     * @private
     * @returns Module node
     */
    protected getApplicationAndModule(applicationName: string, moduleName: string, domainNode?: Node, sublayerName?: string): Node;
    /**
     * Color the child nodes based on what "contain" edge they have.
     * @param childNodes
     */
    protected colorNodeBasedOnParent(childNodes: Node[]): void;
}
export {};
