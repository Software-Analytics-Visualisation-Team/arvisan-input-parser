"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xlsx_1 = require("xlsx");
const structure_1 = require("../structure");
const logger_1 = __importDefault(require("../logger"));
const consumer_producer_parser_1 = __importDefault(require("./consumer-producer-parser"));
const application_group_parser_1 = __importDefault(require("./application-group-parser"));
const integration_parser_1 = __importDefault(require("./integration-parser"));
const dependency_profiles_1 = __importDefault(require("./metrics/dependency-profiles"));
const cohesion_1 = __importDefault(require("./metrics/cohesion"));
const module_details_parser_1 = __importDefault(require("./module-details-parser"));
const graph_post_processor_1 = __importDefault(require("./graph-post-processor"));
function removeDuplicates(elements) {
    const seenElements = new Set();
    return elements.filter((n) => {
        if (seenElements.has(n.data.id))
            return false;
        seenElements.add(n.data.id);
        return true;
    });
}
/**
 * Parse a multiple files read as buffers to a list of entries of the given type
 */
function parseFilesToEntries(files) {
    const workbooks = files.map((file) => (0, xlsx_1.read)(file));
    return workbooks
        .map((workbook) => xlsx_1.utils
        .sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]))
        .flat();
}
/**
 * Parse the given files to a Neo4j / Cytoscape graph object
 * @param structureFiles Files containing the structure of the landscape
 * (domains, applications, sublayers, and modules).
 * @param dependencyFiles Files containing consumers and producers.
 * @param integrationFiles Files containing dynamic data about integrations and service APIs.
 * @param detailsFiles Files containing more details about modules.
 * @param includeModuleLayerLayer Whether the "Layer" layer from the OutSystems Architecture Canvas
 * should be included in the resulting graph
 * @param anonymize Whether the output graph should be anonymized
 * @param onlyDomains If present, only keep nodes/edges that have 0 or more dependencies to
 * one of these domain (names).
 */
function getGraph(structureFiles = [], dependencyFiles = [], integrationFiles = [], detailsFiles = [], includeModuleLayerLayer = false, anonymize = false, onlyDomains = []) {
    logger_1.default.info('Parsing files...');
    const applicationEntries = parseFilesToEntries(structureFiles);
    const consumerProducerEntries = parseFilesToEntries(dependencyFiles);
    const dynamicDataEntries = parseFilesToEntries(integrationFiles);
    const moduleDetailsEntries = parseFilesToEntries(detailsFiles);
    const integrationEntries = dynamicDataEntries ? dynamicDataEntries.filter((e) => e.logtype === 'Integration') : undefined;
    const serviceAPIEntries = dynamicDataEntries ? dynamicDataEntries.filter((e) => e.logtype === 'ServiceAPI') : undefined;
    logger_1.default.info('    Done!');
    let modDetailsParser;
    if (moduleDetailsEntries.length > 0) {
        logger_1.default.info('Parsing module details dataset...');
        modDetailsParser = new module_details_parser_1.default(moduleDetailsEntries, includeModuleLayerLayer);
        logger_1.default.info('    Done!');
    }
    logger_1.default.info('Parsing consumer/producer datasets...');
    const cpParser = new consumer_producer_parser_1.default(consumerProducerEntries, includeModuleLayerLayer, serviceAPIEntries);
    logger_1.default.info('    Done!');
    logger_1.default.info('Parsing application group dataset...');
    const agParser = new application_group_parser_1.default(applicationEntries, includeModuleLayerLayer);
    logger_1.default.info('    Done!');
    let intParser;
    if (integrationEntries) {
        logger_1.default.info('Parsing integration dataset...');
        intParser = new integration_parser_1.default(integrationEntries, includeModuleLayerLayer);
        logger_1.default.info('    Done!');
    }
    logger_1.default.info('Merging datasets...');
    const mergedNodes = removeDuplicates((modDetailsParser ? modDetailsParser.nodes : [])
        .concat(cpParser.nodes)
        .concat(agParser.nodes)
        .concat(intParser ? intParser.nodes : []));
    const mergedContainEdges = removeDuplicates((modDetailsParser ? modDetailsParser.containEdges : [])
        .concat(cpParser.containEdges)
        .concat(agParser.containEdges)
        .concat(intParser ? intParser.containEdges : []));
    const mergedDependencyEdges = removeDuplicates(cpParser.dependencyEdges
        .concat(intParser ? intParser.dependencyEdges : []));
    logger_1.default.info('    Done!');
    const postProcessor = new graph_post_processor_1.default(mergedNodes, mergedContainEdges, mergedDependencyEdges, includeModuleLayerLayer, anonymize, onlyDomains);
    const { nodes } = postProcessor;
    const edges = postProcessor.containEdges.concat(postProcessor.dependencyEdges);
    if (modDetailsParser) {
        logger_1.default.info('Propagating module properties to parent nodes...');
        modDetailsParser.propagateModuleProperties(nodes, edges);
        logger_1.default.info('    Done!');
    }
    logger_1.default.info('Calculate metrics...');
    logger_1.default.info('  Dependency types...');
    const moduleNodes = nodes.filter((n) => n.data.labels.includes(structure_1.GraphLayers.MODULE));
    new dependency_profiles_1.default().find(moduleNodes, nodes, edges);
    logger_1.default.info('    Done!');
    logger_1.default.info('  Cohesion....');
    cohesion_1.default.find(nodes, edges);
    logger_1.default.info('    Done!');
    return {
        elements: { nodes, edges },
    };
}
exports.default = getGraph;
//# sourceMappingURL=index.js.map