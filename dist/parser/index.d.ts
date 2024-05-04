/// <reference types="node" />
import { Graph } from '../structure';
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
export default function getGraph(structureFiles?: Buffer[], dependencyFiles?: Buffer[], integrationFiles?: Buffer[], detailsFiles?: Buffer[], includeModuleLayerLayer?: boolean, anonymize?: boolean, onlyDomains?: string[]): Graph;
