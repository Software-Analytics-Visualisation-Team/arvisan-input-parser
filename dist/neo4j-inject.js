"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectGraphAdminTools = exports.copyCsvDatasets = exports.injectGraphCypher = void 0;
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const node_child_process_1 = require("node:child_process");
const fs_1 = __importDefault(require("fs"));
const node_path_1 = __importDefault(require("node:path"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Add the graph to a Neo4j Database using a Cypher query.
 * @param password Password of the database user
 * @param databaseName Optional database name
 * @param url Optional URL of the database (defaults to localhost).
 * @param nodesFile Neo4j path to the nodes file (defaults to local file in import directory)
 * @param edgesFile Neo4j path to the relationships file
 * (defaults to local file in import directory)
 */
async function injectGraphCypher(password, databaseName, url = 'bolt://localhost:7687', nodesFile = 'file:///nodes.csv', edgesFile = 'file:///relationships.csv') {
    logger_1.default.info('Seeding Neo4j database...');
    const driver = neo4j_driver_1.default.driver(url, neo4j_driver_1.default.auth.basic('neo4j', password), {});
    const session = driver.session({ database: databaseName });
    try {
        await session.run('MATCH (n) DETACH delete n');
    }
    catch (e) {
        console.error(`Could not delete graph: ${e}`);
        await session.close();
        await driver.close();
        return;
    }
    logger_1.default.info(`  Connected to Neo4j database at ${url} (${databaseName || 'neo4j'})`);
    const nodesQuery = `
  CALL apoc.periodic.iterate(
    "LOAD CSV WITH HEADERS from '${nodesFile}' AS row RETURN row",
    "CALL apoc.create.node(split(row[':LABEL'], ';'), {
        id: row['id:ID'],
        fullName: row.fullName,
        simpleName: row.simpleName,
        color: row.color,
        dependencyProfileCategory: row.dependencyProfileCategory,
        cohesion: toFloat(row.cohesion),
        fileSizeKB: toInteger(row['fileSizeKB:INT']),
        nrScreens: toInteger(row['nrScreens:INT']),
        nrEntities: toInteger(row['nrEntities:INT']),
        nrPublicElements: toInteger(row['nrPublicElements:INT']),
        nrRESTConsumers: toInteger(row['nrRESTConsumers:INT']),
        nrRESTProducers: toInteger(row['nrRESTProducers:INT'])
    }) YIELD node RETURN count(*)",
    { batchSize: 1000, parallel: true }
  )`;
    const edgesQuery = `
  CALL apoc.periodic.iterate(
    "LOAD CSV WITH HEADERS from '${edgesFile}' AS row RETURN row",
    "MATCH (start WHERE start.id = row[':START_ID'])
    MATCH (end WHERE end.id = row[':END_ID'])
    CALL apoc.create.relationship(start, row[':TYPE'], {
        id: row.id,
        references: row.references,
        dependencyTypes: row.dependencyTypes,
        nrDependencies: toInteger(row['nrDependencies:INT']),
        nrCalls: toInteger(row['nrCalls:INT'])
    }, end) YIELD rel RETURN count(*)",
    { batchSize: 1000, parallel: true }
  )`;
    try {
        logger_1.default.info('  Seed nodes...');
        await session.run(nodesQuery);
        logger_1.default.info('    Done!');
        logger_1.default.info('  Seed relationships...');
        await session.run(edgesQuery);
        logger_1.default.info('    Done!');
    }
    catch (e) {
        console.error(`Could not inject graph: ${e}`);
        throw e;
    }
    finally {
        await session.close();
        await driver.close();
    }
}
exports.injectGraphCypher = injectGraphCypher;
/**
 * Move the output files to the specified Neo4j import directory.
 * Necessary to import the data using Cypher (local) or Admin tools
 * @param neo4jImportDir Absolute path the import directory
 * @param nodesFile name of the nodes file on disk
 * @param edgesFile name of the relationships file on dislk
 */
function copyCsvDatasets(neo4jImportDir, nodesFile = 'nodes.csv', edgesFile = 'relationships.csv') {
    if (!fs_1.default.existsSync(neo4jImportDir)) {
        throw new Error('Neo4j Import Directory cannot be found. See https://neo4j.com/docs/operations-manual/current/configuration/file-locations/ to find the path to your home and thus import directory.');
    }
    if (!fs_1.default.existsSync(nodesFile)) {
        throw new Error(`${nodesFile} (containing all nodes) cannot be found on disk`);
    }
    if (!fs_1.default.existsSync(edgesFile)) {
        throw new Error(`${edgesFile} (containing all edges) cannot be found on disk`);
    }
    fs_1.default.copyFileSync(nodesFile, node_path_1.default.join(neo4jImportDir, nodesFile));
    fs_1.default.copyFileSync(edgesFile, node_path_1.default.join(neo4jImportDir, edgesFile));
}
exports.copyCsvDatasets = copyCsvDatasets;
/**
 * Import all nodes and relationships using the Neo4j Admin tools CLI program.
 * Make sure you have called copyCsvDatasets() first.
 * @param neo4jHomeDir Absolute path the Neo4j home directory where the import folder and the
 * admin tools executables are located
 * @param databaseName Optional name of the database that should be seeded to
 * @param nodesFile Name of the nodes file on disk
 * @param edgesFile Name of the relationships file on disk
 */
function injectGraphAdminTools(neo4jHomeDir, databaseName = 'neo4j', nodesFile = 'nodes.csv', edgesFile = 'relationships.csv') {
    const executablePath = node_path_1.default.join(neo4jHomeDir, '/bin/neo4j-admin');
    if (!fs_1.default.existsSync(executablePath) && !fs_1.default.existsSync(`${executablePath}.bat`) && !fs_1.default.existsSync(`${executablePath}.ps1`)) {
        throw new Error('/bin/neo4j-admin cannot be found in the given Neo4j home directory');
    }
    if (!fs_1.default.existsSync(node_path_1.default.join(neo4jHomeDir, '/import', nodesFile))) {
        throw new Error(`${nodesFile} (containing all nodes) cannot be found in the import directory`);
    }
    if (!fs_1.default.existsSync(node_path_1.default.join(neo4jHomeDir, '/import', edgesFile))) {
        throw new Error(`${edgesFile} (containing all relationships) cannot be found in the import directory`);
    }
    (0, node_child_process_1.execSync)(`${executablePath} database import full --overwrite-destination --nodes=import/${nodesFile} --relationships=import/${edgesFile} ${databaseName}`, { stdio: 'inherit' });
}
exports.injectGraphAdminTools = injectGraphAdminTools;
//# sourceMappingURL=neo4j-inject.js.map