export declare enum GraphLayers {
    DOMAIN = "Domain",
    APPLICATION = "Application",
    LAYER = "Layer",
    SUB_LAYER = "Sublayer",
    MODULE = "Module"
}
export declare enum ModuleLayers {
    END_USER = "Enduser",
    CORE = "Core",
    FOUNDATION = "Foundation"
}
export declare enum EndUserLayerSublayers {
    END_USER = "Enduser"
}
export declare enum CoreLayerSublayers {
    CORE = "Core",
    API = "API",
    CORE_WIDGETS = "CoreWidgets",
    COMPOSITE_LOGIC = "CompositeLogic",
    CORE_SERVICE = "CoreService"
}
export declare enum FoundationLayerSublayers {
    FOUNDATION = "Foundation",
    STYLE_GUIDE = "StyleGuide",
    FOUNDATION_SERVICE = "FoundationService",
    LIBRARY = "Library"
}
export declare const moduleColors: {
    Enduser: string;
    Core: string;
    Foundation: string;
};
export type ModuleSublayer = EndUserLayerSublayers | CoreLayerSublayers | FoundationLayerSublayers;
export declare const sublayerOrdering: ModuleSublayer[];
export declare enum ModuleDependencyProfileCategory {
    HIDDEN = "hidden",
    INBOUND = "inbound",
    OUTBOUND = "outbound",
    TRANSIT = "transit",
    NONE = ""
}
export type NodePropertiesDetails = {
    fileSizeKB?: number;
    nrScreens?: number;
    nrEntities?: number;
    nrPublicElements?: number;
    nrRESTConsumers?: number;
    nrRESTProducers?: number;
};
export type NodeProperties = NodePropertiesDetails & {
    fullName: string;
    simpleName: string;
    color: string;
    dependencyProfileCategory: ModuleDependencyProfileCategory;
    cohesion?: number;
};
export declare const optionalModuleProperties: (keyof NodePropertiesDetails)[];
export interface Node {
    data: {
        id: string;
        properties: NodeProperties;
        labels: (string | GraphLayers)[];
    };
}
export declare enum RelationshipLabel {
    CONTAINS = "contains",
    CALLS = "calls",
    VIOLATES = "violates"
}
export declare enum DependencyType {
    COMPILE_TIME = "compile_time",
    RUNTIME = "runtime",
    ENTITY = "entity"
}
export interface EdgeProperties {
    references: Map<string, string[]>;
    dependencyTypes?: DependencyType[];
    nrDependencies?: number;
    nrCalls?: number;
}
export interface Edge {
    data: {
        id: string;
        source: string;
        target: string;
        label: RelationshipLabel;
        properties: EdgeProperties;
    };
}
export interface Graph {
    elements: {
        nodes: Node[];
        edges: Edge[];
    };
}
export declare function formatName(id: string): string;
export declare const unclassifiedDomainName = "no_domain";
