# Vopak Static Architecture Transformer

This script parses OutSystems consumer-producer data with functional domain (Application group) data into a labeled property graph, readable by Cytoscape JS.
However, a module also exists to inject this complete Cytoscape JS graph into a Neo4j database instance.

## Installation
- Install Node 20.
- `npm install`.
- `npm run run <application group file> <consumer-producer dataset>`.
