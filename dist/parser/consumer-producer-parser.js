"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const structure_1 = require("../structure");
const outsystems_arch_canvas_1 = require("./outsystems-arch-canvas");
const root_parser_1 = __importDefault(require("./root-parser"));
class ConsumerProducerParser extends root_parser_1.default {
    constructor(consumerProducerEntries, includeModuleLayerLayer, serviceAPIEntries = []) {
        super(includeModuleLayerLayer);
        const filteredServiceAPIEntries = serviceAPIEntries.filter((e) => e.logtype === 'ServiceAPI');
        consumerProducerEntries.forEach((entry) => {
            const prodModuleNode = this.getApplicationAndModule(entry['Prod Application'], entry['Prod Espace']);
            const consModuleNode = this.getApplicationAndModule(entry['Cons Application'], entry['Cons Espace']);
            const dependencyEdgeId = `${consModuleNode.data.id}__${prodModuleNode.data.id}`;
            const dependencyEdge = this.getDependencyEdge(dependencyEdgeId);
            const dependencyType = (0, outsystems_arch_canvas_1.consumerTypeToDependencyType)(entry['Reference Kind']);
            let nrCalls;
            if (dependencyType === structure_1.DependencyType.RUNTIME) {
                nrCalls = 0;
                const serviceAPIEntry = filteredServiceAPIEntries.find((e) => e.EndpointAndMethod === entry['Reference Name']);
                if (serviceAPIEntry) {
                    nrCalls = serviceAPIEntry.count;
                }
                else {
                    nrCalls = 0;
                }
            }
            if (dependencyEdge != null) {
                if (dependencyEdge.data.properties.nrDependencies != null) {
                    dependencyEdge.data.properties.nrDependencies += 1;
                }
                if (dependencyEdge.data.properties.nrCalls != null && nrCalls) {
                    dependencyEdge.data.properties.nrCalls += nrCalls;
                }
                if (dependencyEdge.data.properties.references.has(entry['Reference Kind'])) {
                    dependencyEdge.data.properties.references.get(entry['Reference Kind']).push(entry['Reference Name']);
                }
                dependencyEdge.data.properties.dependencyTypes?.push(dependencyType);
            }
            else if (dependencyEdge == null) {
                this.dependencyEdges.push({
                    data: {
                        id: dependencyEdgeId,
                        source: consModuleNode.data.id,
                        target: prodModuleNode.data.id,
                        label: structure_1.RelationshipLabel.CALLS,
                        properties: {
                            references: new Map().set(entry['Reference Kind'], [entry['Reference Name']]),
                            dependencyTypes: [dependencyType],
                            nrDependencies: 1,
                            nrCalls,
                        },
                    },
                });
            }
        });
        this.dependencyEdges.forEach((e) => {
            e.data.properties.dependencyTypes = Array.from(new Set(e.data.properties.dependencyTypes));
        });
    }
}
exports.default = ConsumerProducerParser;
//# sourceMappingURL=consumer-producer-parser.js.map