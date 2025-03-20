"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const structure_1 = require("../structure");
const logger_1 = __importDefault(require("../logger"));
class RootParser {
    /**
     * @param includeModuleLayerLayer Whether a fifth layer between application and sublayer
     * (namely Layer) should be included in the resulting graph
     */
    constructor(includeModuleLayerLayer) {
        this.includeModuleLayerLayer = includeModuleLayerLayer;
        this.nodes = [];
        this.containEdges = [];
        this.dependencyEdges = [];
    }
    getNode(id) {
        return this.nodes.find((n) => n.data.id === id);
    }
    getDependencyEdge(id) {
        return this.dependencyEdges.find((e) => e.data.id === id);
    }
    getDomainId(domainName) {
        return (0, structure_1.formatName)(`D_${domainName}`);
    }
    getApplicationId(applicationName) {
        return (0, structure_1.formatName)(`A_${applicationName}`);
    }
    getApplicationWithLayerId(applicationId, layer) {
        if (!layer)
            return applicationId;
        return (0, structure_1.formatName)(`${applicationId}__${layer}`);
    }
    /**
     * Get the ID of the parent node that belongs to the given application
     * @param applicationId
     * @param layer
     * @param sublayer
     * @protected
     */
    getApplicationWithSublayerId(applicationId, layer, sublayer) {
        const applicationWithLayerId = this.getApplicationWithLayerId(applicationId, layer);
        if (!sublayer)
            return applicationWithLayerId;
        return (0, structure_1.formatName)(`${applicationWithLayerId}__${sublayer}`);
    }
    /**
     * Revert the mapping done by getApplicationWithSublayerId and getApplicationWithLayerId
     * to extract only the application ID
     * @param layerId
     * @protected
     */
    getApplicationIdFromLayer(layerId) {
        const [applicationId] = layerId.split('__')[0];
        return applicationId;
    }
    getModuleId(applicationName, moduleName) {
        return (0, structure_1.formatName)(`A_${applicationName}__M_${moduleName}`);
    }
    /** Convert a string to pascal case (upper camel case) */
    pascalize(str) {
        return str.replace(/^\w|[A-Z]|\b\w/g, (word) => word.toUpperCase()).replace(/\s+/g, '');
    }
    /**
     * Given the sublayer name, return its layer and sublayer references for processing
     * @param sublayerName
     * @private
     */
    sublayerNameToLayers(sublayerName) {
        const parsedName = this.pascalize(sublayerName);
        const endUserSublayers = Object.values(structure_1.EndUserLayerSublayers);
        const coreSublayers = Object.values(structure_1.CoreLayerSublayers);
        const foundationSublayers = Object.values(structure_1.FoundationLayerSublayers);
        if (endUserSublayers.includes(parsedName)) {
            return { layer: structure_1.ModuleLayers.END_USER, sublayer: structure_1.EndUserLayerSublayers.END_USER };
        }
        if (coreSublayers.includes(parsedName)) {
            return { layer: structure_1.ModuleLayers.CORE, sublayer: parsedName };
        }
        if (foundationSublayers.includes(parsedName)) {
            return { layer: structure_1.ModuleLayers.FOUNDATION, sublayer: parsedName };
        }
        logger_1.default.warn(`Could not match sublayer "${sublayerName}" with any sublayer definitions.`);
        return undefined;
    }
    /**
     * Given the name of a module, extract the type of module based on its extension
     * If no explicit defined extension, the module will be of layer Enduser
     * @param moduleName
     */
    moduleSuffixToLayers(moduleName) {
        const suffix = moduleName.split('_').pop()?.toLowerCase();
        switch (suffix) {
            case 'api':
                return { layer: structure_1.ModuleLayers.CORE, sublayer: structure_1.CoreLayerSublayers.API };
            case 'cw':
                return { layer: structure_1.ModuleLayers.CORE, sublayer: structure_1.CoreLayerSublayers.CORE_WIDGETS };
            case 'cs':
            case 'data':
                return { layer: structure_1.ModuleLayers.CORE, sublayer: structure_1.CoreLayerSublayers.CORE_SERVICE };
            case 'core':
                return { layer: structure_1.ModuleLayers.CORE, sublayer: structure_1.CoreLayerSublayers.CORE };
            case 'bl':
                return { layer: structure_1.ModuleLayers.CORE, sublayer: structure_1.CoreLayerSublayers.COMPOSITE_LOGIC };
            case 'theme':
            case 'thm':
            case 'th':
                return { layer: structure_1.ModuleLayers.FOUNDATION, sublayer: structure_1.FoundationLayerSublayers.STYLE_GUIDE };
            case 'is':
                return {
                    layer: structure_1.ModuleLayers.FOUNDATION,
                    sublayer: structure_1.FoundationLayerSublayers.FOUNDATION_SERVICE,
                };
            case 'lib':
                return { layer: structure_1.ModuleLayers.FOUNDATION, sublayer: structure_1.FoundationLayerSublayers.LIBRARY };
            default: break;
        }
        const prefix = moduleName.split('_').shift()?.toLowerCase();
        switch (prefix) {
            case 'cdm':
                return { layer: structure_1.ModuleLayers.FOUNDATION, sublayer: structure_1.FoundationLayerSublayers.LIBRARY };
            default: break;
        }
        return { layer: structure_1.ModuleLayers.END_USER, sublayer: structure_1.EndUserLayerSublayers.END_USER };
    }
    /**
     * Create a domain node
     * @param domainName
     */
    createDomainNode(domainName) {
        // If this entry is empty, skip this entry
        if (domainName === '' || domainName == null)
            throw new Error('No domain name defined');
        // Create the ID. Skip this entry if the node already exists
        const id = this.getDomainId(domainName);
        return {
            data: {
                id,
                properties: {
                    fullName: domainName,
                    simpleName: domainName,
                    color: '#7B7D7D',
                    nodeProperties: '',
                    dependencyProfileCategory: structure_1.ModuleDependencyProfileCategory.NONE,
                    cohesion: 0,
                },
                labels: [structure_1.GraphLayers.DOMAIN],
            },
        };
    }
    /**
     * Create an application node
     * @param applicationName
     */
    createApplicationNode(applicationName) {
        // If this entry is empty, skip this entry
        if (applicationName === '' || applicationName == null)
            throw new Error('No application name defined');
        // Create the ID. Skip this entry if the node already exists
        const id = this.getApplicationId(applicationName);
        return {
            data: {
                id,
                properties: {
                    fullName: applicationName,
                    simpleName: applicationName,
                    color: '#7B7D7D',
                    nodeProperties: '',
                    dependencyProfileCategory: structure_1.ModuleDependencyProfileCategory.NONE,
                    cohesion: 0,
                },
                labels: [structure_1.GraphLayers.APPLICATION],
            },
        };
    }
    /**
     * Create a module node
     * @param applicationName
     * @param moduleName
     */
    createModuleNode(applicationName, moduleName) {
        // If this entry is empty, skip this entry
        if (moduleName === '' || moduleName == null)
            throw new Error('No module name defined');
        // Create the ID. Skip this entry if the node already exists
        const id = this.getModuleId(applicationName, moduleName);
        return {
            data: {
                id,
                properties: {
                    fullName: moduleName,
                    simpleName: moduleName,
                    color: '#7B7D7D',
                    nodeProperties: '',
                    dependencyProfileCategory: structure_1.ModuleDependencyProfileCategory.HIDDEN,
                },
                labels: [structure_1.GraphLayers.MODULE],
            },
        };
    }
    /**
     * Create a set of layer and sublayer nodes for each application node
     * @param applicationNodes
     */
    getApplicationModuleLayerNodesAndEdges(applicationNodes) {
        const nodes = [];
        const edges = [];
        applicationNodes.forEach((applicationNode) => {
            Object.values(structure_1.ModuleLayers).forEach((layer) => {
                let layerNode;
                if (this.includeModuleLayerLayer) {
                    layerNode = {
                        data: {
                            id: this.getApplicationWithLayerId(applicationNode.data.id, layer),
                            properties: {
                                fullName: `${applicationNode.data.properties.simpleName} ${layer}`,
                                simpleName: layer,
                                color: structure_1.moduleColors[layer],
                                nodeProperties: '',
                                dependencyProfileCategory: structure_1.ModuleDependencyProfileCategory.NONE,
                                cohesion: 0,
                            },
                            labels: [structure_1.GraphLayers.LAYER, `layer_${layer}`],
                        },
                    };
                    const layerEdge = {
                        data: {
                            id: (0, structure_1.formatName)(`${layerNode.data.id}__contains`),
                            source: applicationNode.data.id,
                            target: layerNode.data.id,
                            properties: {
                                references: new Map(),
                            },
                            label: structure_1.RelationshipLabel.CONTAINS,
                        },
                    };
                    nodes.push(layerNode);
                    edges.push(layerEdge);
                }
                let subLayerKeys;
                switch (layer) {
                    case structure_1.ModuleLayers.END_USER:
                        subLayerKeys = Object.values(structure_1.EndUserLayerSublayers);
                        break;
                    case structure_1.ModuleLayers.CORE:
                        subLayerKeys = Object.values(structure_1.CoreLayerSublayers);
                        break;
                    case structure_1.ModuleLayers.FOUNDATION:
                        subLayerKeys = Object.values(structure_1.FoundationLayerSublayers);
                        break;
                    default:
                        subLayerKeys = [];
                        break;
                }
                const subLayerNodes = [];
                const subLayerEdges = [];
                subLayerKeys.forEach((subLayer) => {
                    const subLayerNode = ({
                        data: {
                            id: this.getApplicationWithSublayerId(applicationNode.data.id, layer, subLayer),
                            properties: {
                                fullName: `${applicationNode.data.properties.simpleName} ${subLayer}`,
                                simpleName: subLayer,
                                color: structure_1.moduleColors[layer],
                                nodeProperties: '',
                                dependencyProfileCategory: structure_1.ModuleDependencyProfileCategory.NONE,
                                cohesion: 0,
                            },
                            labels: [structure_1.GraphLayers.SUB_LAYER, `Sublayer_${subLayer}`],
                        },
                    });
                    const subLayerEdge = ({
                        data: {
                            id: (0, structure_1.formatName)(`${subLayerNode.data.id}__contains`),
                            source: layerNode ? layerNode.data.id : applicationNode.data.id,
                            target: subLayerNode.data.id,
                            properties: {
                                references: new Map(),
                            },
                            label: structure_1.RelationshipLabel.CONTAINS,
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
    createContainEdge(source, target) {
        return {
            data: {
                id: `${source.data.id}__${target.data.id}`,
                source: source.data.id,
                target: target.data.id,
                label: structure_1.RelationshipLabel.CONTAINS,
                properties: {
                    references: new Map(),
                },
            },
        };
    }
    /**
     * Remove nodes and containment edges of (sub)layer nodes without any children in-place.
     * @returns new set of nodes and containment edges.
     */
    trim() {
        /*
         * Trim sublayer nodes
         */
        let filteredNodes = this.nodes.filter((n) => {
            if (!n.data.labels.includes(structure_1.GraphLayers.SUB_LAYER))
                return true;
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
            if (!n.data.labels.includes(structure_1.GraphLayers.LAYER))
                return true;
            return filteredEdges.some((e) => e.data.source === n.data.id);
        });
        filteredEdges = filteredEdges.filter((e) => filteredNodes
            .some((n) => n.data.id === e.data.target));
        this.nodes = filteredNodes;
        this.containEdges = filteredEdges;
        return { filteredNodes, filteredEdges };
    }
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
    getApplicationAndModule(applicationName, moduleName, domainNode, sublayerName) {
        // Find or create the application node
        const appId = this.getApplicationId(applicationName);
        let appNode = this.getNode(appId);
        if (!appNode) {
            appNode = this.createApplicationNode(applicationName);
            if (domainNode) {
                const domainContainEdge = this.createContainEdge(domainNode, appNode);
                this.containEdges.push(domainContainEdge);
            }
            const { nodes: layerNodes, edges: layerEdges, } = this.getApplicationModuleLayerNodesAndEdges([appNode]);
            this.nodes.push(appNode, ...layerNodes);
            this.containEdges.push(...layerEdges);
        }
        // Find or create the module node
        const moduleId = this.getModuleId(applicationName, moduleName);
        let moduleNode = this.getNode(moduleId);
        if (!moduleNode) {
            moduleNode = this.createModuleNode(applicationName, moduleName);
            this.nodes.push(moduleNode);
        }
        // Try to find the (sub)layer definitions for this module if explicitly given
        const layers = sublayerName ? this.sublayerNameToLayers(sublayerName) : undefined;
        if (layers) {
            // If found, create a containment edge between from sublayer node to the module
            const { layer: moduleLayer, sublayer: moduleSublayer, } = layers;
            const parentId = this.getApplicationWithSublayerId(appId, moduleLayer, moduleSublayer);
            const parentNode = this.getNode(parentId);
            if (!parentNode) {
                throw new Error(`Parent node with ID ${parentId} not found.`);
            }
            const containsEdge = this.createContainEdge(parentNode, moduleNode);
            this.containEdges.push(containsEdge);
        }
        else {
            // If not found, create a containment edge from the application node to the module.
            // Note that these edges are not allowed by the output spec, so this edge needs to
            // be replaced by an actual sublayer containment edge. Unfortunately, we cannot do
            // the suffix classification at this stage, because then this module could have two
            // containment edges from two different sublayers (a manual and a suffix
            // classification one). These edges are indistinguishable, so we have no idea which
            // edge is the "true" one.
            const containsEdge = this.createContainEdge(appNode, moduleNode);
            this.containEdges.push(containsEdge);
        }
        return moduleNode;
    }
    /**
     * Color the child nodes based on what "contain" edge they have.
     * @param childNodes
     */
    colorNodeBasedOnParent(childNodes) {
        childNodes.forEach((moduleNode) => {
            const containEdge = this.containEdges.find((e) => e.data.target === moduleNode.data.id && e.data.label === 'contains');
            if (!containEdge)
                return;
            const parentNode = this.nodes.find((n) => n.data.id === containEdge.data.source);
            if (!parentNode)
                return;
            // eslint-disable-next-line no-param-reassign
            moduleNode.data.properties.color = parentNode.data.properties.color;
        });
    }
}
exports.default = RootParser;
//# sourceMappingURL=root-parser.js.map