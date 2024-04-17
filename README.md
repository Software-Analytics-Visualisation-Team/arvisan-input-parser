# Arvisan Input Parser

This script parses OutSystems consumer-producer data with functional domain (Application group) data into a labeled property graph, readable by Cytoscape JS.
Optionally, more data can be included about dynamic REST-like integrations that OutSystems does not track, or more details/properties about individual modules.
All this data is matched, parsed and written to JSON files, csv files or a Neo4j database instance.

The generated data adheres to the Node/Relationship specification that is required by [Arvisan-backend](https://github.com/yoronex/arvisan-backend).
Especially, some metrics like "DependencyProfiles" and "Coherence" required the full context of the graph, which might not be possible when querying a specific part.
Therefore, these attributes are calculated by this data parser and stored in the database instead.

This tool has been designed with OutSystems environments in mind and as test data.
However, as long as the provided datasets adhere to the specifications, they should also be correctly parsed.

## Installation & usage
- Install Node 20.
- `npm install`.
- Run `npm run transform -- --help` to get a list of all possible parameters. Note that `--grouping (-g)` and `--dependencies (-d)` are required.
- Run `npm run transform -- <parameters>` to run the tool.

The specifications of the required input data can be found in `src/input-spec.ts`.
Input files can be of any type that SheetJS is able to read correctly.
During development, .xlsx and .csv datasets were used.

## Tips
- Using a local Neo4j database instance is preferred. 
Then, you can use the `--seedLocal` option to seed directly to the database internal files instead of through the database engine.
Given the size of the input data, this might bring data injection time down from several minutes to just a few seconds.
- Use the `--layer` option to include the OutSystems "layer"-layer from the Architecture Canvas in the resulting graph.
Without this option, only the "sublayer"-layer from the Architecture Canvas is included.
