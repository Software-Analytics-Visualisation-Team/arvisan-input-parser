/**
 * Add the graph to a Neo4j Database using a Cypher query.
 * @param password Password of the database user
 * @param databaseName Optional database name
 * @param url Optional URL of the database (defaults to localhost).
 * @param nodesFile Neo4j path to the nodes file (defaults to local file in import directory)
 * @param edgesFile Neo4j path to the relationships file
 * (defaults to local file in import directory)
 */
export declare function injectGraphCypher(password: string, databaseName?: string, url?: string, nodesFile?: string, edgesFile?: string): Promise<void>;
/**
 * Move the output files to the specified Neo4j import directory.
 * Necessary to import the data using Cypher (local) or Admin tools
 * @param neo4jImportDir Absolute path the import directory
 * @param nodesFile name of the nodes file on disk
 * @param edgesFile name of the relationships file on dislk
 */
export declare function copyCsvDatasets(neo4jImportDir: string, nodesFile?: string, edgesFile?: string): void;
/**
 * Import all nodes and relationships using the Neo4j Admin tools CLI program.
 * Make sure you have called copyCsvDatasets() first.
 * @param neo4jHomeDir Absolute path the Neo4j home directory where the import folder and the
 * admin tools executables are located
 * @param databaseName Optional name of the database that should be seeded to
 * @param nodesFile Name of the nodes file on disk
 * @param edgesFile Name of the relationships file on disk
 */
export declare function injectGraphAdminTools(neo4jHomeDir: string, databaseName?: string, nodesFile?: string, edgesFile?: string): void;
