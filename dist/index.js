"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
const node_path_1 = __importDefault(require("node:path"));
const parser_1 = __importDefault(require("./parser"));
const graph_1 = require("./graph");
const neo4j_inject_1 = require("./neo4j-inject");
const logger_1 = __importDefault(require("./logger"));
const csv_1 = __importDefault(require("./csv"));
const violations_1 = require("./violations");
const read_files_1 = require("./read-files");
function groupInputFiles(newFile, allFiles) {
    allFiles.push(newFile);
    return allFiles;
}
const startTime = new Date();
commander_1.program
    .name('npm run transform')
    .description('Small tool to parse OutSystems architecture/dependency datasets into ')
    .option('-s, --seedLocal <Neo4jHomeDir>', 'seed the resulting graph the Neo4j database using Neo4j Admin tools, which can be found at the given Neo4j home directory')
    .option('--database <name>', 'name of the Neo4j database, defaults to "neo4j"')
    .option('--seedQueryPassword <password>', 'seed the resulting graph the Neo4j database using a query, which can be accessed using the given password')
    .option('--seedQueryImportDir <Neo4jImportDir>', 'seed the resulting graph the Neo4j database using a query, which has the following import directory')
    .option('--seedQueryUrl <url>', 'seed the resulting graph the Neo4j database using a query, which can be found at the given url (optional)')
    .option('-j, --json', 'output the resulting graph as a .json file')
    .option('-l, --layer', 'include "layer" nodes in the resulting graph')
    .option('-g, --grouping <files>', 'locations of domain (application group) and sublayer dataset(s)', groupInputFiles, [])
    .option('-d, --dependencies <files>', 'locations of dependency dataset(s)', groupInputFiles, [])
    .option('-i, --integrations <files>', 'locations of integration/service API dataset(s)', groupInputFiles, [])
    .option('-m, --moduleDetails <files>', 'locations of module details dataset(s)', groupInputFiles, [])
    .option('-a, --anonymize', 'output should be anonymized with')
    .option('-f, --filter <domainNames>', 'which domains to filter on', groupInputFiles, []);
commander_1.program.parse();
const options = commander_1.program.opts();
logger_1.default.info('Reading files from disk...');
const groupingData = options.grouping?.map(read_files_1.readFileFromDisk);
const dependencyFiles = options.dependencies?.map(read_files_1.readFileFromDisk);
const integrationFile = options.integrations?.map(read_files_1.readFileFromDisk);
const detailsFiles = options.moduleDetails?.map(read_files_1.readFileFromDisk);
logger_1.default.info('    Done!');
const graph = (0, parser_1.default)(groupingData, dependencyFiles, integrationFile, detailsFiles, !!options.layer, !!options.anonymize, options.filter);
const violations = (0, violations_1.getViolationsAsGraph)();
logger_1.default.info(`Generated LPG with ${graph.elements.nodes.length} nodes and ${graph.elements.edges.length} edges.`);
// If we have at least one module details file, all nodes should have aggregates
// of these numerical properties.
const propagatedProperties = options.moduleDetails.length > 0;
(0, graph_1.validateGraph)(graph, propagatedProperties);
if (options.json) {
    fs_1.default.writeFileSync('graph.json', JSON.stringify(graph, null, 4));
    logger_1.default.info('Graph written to .json file');
}
const totalGraph = {
    elements: {
        nodes: [...graph.elements.nodes, ...violations.elements.nodes],
        edges: [...graph.elements.edges, ...violations.elements.edges],
    },
};
(0, csv_1.default)(totalGraph);
logger_1.default.info('Graph written to .csv files');
if (options.seedLocal) {
    logger_1.default.info('Start seeding to Neo4j database...');
    (0, neo4j_inject_1.copyCsvDatasets)(node_path_1.default.join(options.seedLocal, '/import'));
    (0, neo4j_inject_1.injectGraphAdminTools)(options.seedLocal, options.database);
    logger_1.default.info('    Done!');
}
function finish() {
    const finishTime = new Date().getTime() - startTime.getTime();
    logger_1.default.info(`Tasks finished in ${Math.round(finishTime / 1000)}s. Exit.`);
}
if (options.seedQueryPassword && options.seedQueryImportDir) {
    (0, neo4j_inject_1.copyCsvDatasets)(options.seedQueryImportDir);
    (0, neo4j_inject_1.injectGraphCypher)(options.seedQueryPassword, options.database, options.seedRemoteUrl).then(() => {
        finish();
        process.exit(0);
    });
}
else {
    finish();
}
//# sourceMappingURL=index.js.map