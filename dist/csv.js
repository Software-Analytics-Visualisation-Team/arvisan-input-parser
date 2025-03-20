"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMappingToDisk = exports.getCsvMapping = exports.writeEdgesToDisk = exports.getCsvEdges = exports.writeNodesToDisk = exports.getCsvNodes = void 0;
const fs_1 = __importDefault(require("fs"));
function getCsvNodes(nodes, header = true) {
    const headers = [
        'id:ID', ':LABEL', 'fullName', 'simpleName', 'color', 'nodeProperties',
        // Optional properties
        'dependencyProfileCategory', 'cohesion',
        'fileSizeKB:INT', 'nrScreens:INT', 'nrEntities:INT',
        'nrPublicElements:INT', 'nrRESTConsumers:INT', 'nrRESTProducers:INT',
    ];
    const rows = nodes
        .map((n) => [
        n.data.id,
        n.data.labels.join(';'),
        n.data.properties.fullName,
        n.data.properties.simpleName,
        n.data.properties.color,
        // Optional properties
        n.data.properties.nodeProperties,
        n.data.properties.dependencyProfileCategory,
        n.data.properties.cohesion,
        n.data.properties.fileSizeKB,
        n.data.properties.nrScreens,
        n.data.properties.nrEntities,
        n.data.properties.nrPublicElements,
        n.data.properties.nrRESTConsumers,
        n.data.properties.nrRESTProducers,
    ])
        .map((row) => {
        if (row.length !== headers.length) {
            throw new Error(`Row ${row} does not have the correct amount of columns`);
        }
        return row;
    })
        .map((x) => x.join(','));
    if (header) {
        return Buffer.from([headers, ...rows].join('\r\n'));
    }
    return Buffer.from(rows.join('\r\n'));
}
exports.getCsvNodes = getCsvNodes;
function writeNodesToDisk(nodes, fileName = 'nodes.csv', header = true) {
    fs_1.default.writeFileSync(fileName, getCsvNodes(nodes, header));
}
exports.writeNodesToDisk = writeNodesToDisk;
function getCsvEdges(edges, header = true) {
    const headers = ['id', ':TYPE', ':START_ID', ':END_ID', 'references', 'dependencyTypes', 'nrDependencies:INT', 'nrCalls:INT'];
    const rows = edges
        .map((n) => {
        const references = {};
        n.data.properties.references?.forEach((value, key) => {
            references[key] = value;
        });
        return [
            n.data.id,
            n.data.label.toUpperCase(),
            n.data.source,
            n.data.target,
            `"${JSON.stringify(references).replaceAll('"', '""')}"`,
            n.data.properties.dependencyTypes?.join('|'),
            n.data.properties.nrDependencies,
            n.data.properties.nrCalls,
        ];
    })
        .map((row) => {
        if (row.length !== headers.length) {
            throw new Error(`Row ${row} does not have the correct amount of columns`);
        }
        return row;
    })
        .map((x) => x.join(','));
    if (header) {
        return Buffer.from([headers, ...rows].join('\r\n'));
    }
    return Buffer.from(rows.join('\r\n'));
}
exports.getCsvEdges = getCsvEdges;
function writeEdgesToDisk(edges, fileName = 'relationships.csv', header = true) {
    fs_1.default.writeFileSync(fileName, getCsvEdges(edges, header));
}
exports.writeEdgesToDisk = writeEdgesToDisk;
function getCsvMapping(map) {
    const rows = [['from', 'to']];
    map.forEach((value, key) => rows.push([key, value]));
    return Buffer.from(rows.map((r) => r.join(',')).join('\r\n'));
}
exports.getCsvMapping = getCsvMapping;
function writeMappingToDisk(map, fileName) {
    fs_1.default.writeFileSync(fileName, getCsvMapping(map));
}
exports.writeMappingToDisk = writeMappingToDisk;
function graphToCsv(graph, name, header = true) {
    writeNodesToDisk(graph.elements.nodes, name ? `${name}-nodes.csv` : undefined, header);
    writeEdgesToDisk(graph.elements.edges, name ? `${name}-relationships.csv` : undefined, header);
}
exports.default = graphToCsv;
//# sourceMappingURL=csv.js.map