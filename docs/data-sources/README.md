# Data sources
The input data parser takes data from four different sources.
The different columns are named according to their OutSystems counterparts to ensure an easy data parsing and importing
process for OutSystems users.
However, if columns are renamed accordingly, the parser should also work for datasets from different sources.

The four different datasets are described below. For the actual input specifications,
also consult [the input specifications in the source code](../../src/input-spec.ts).
This file contains the names of all columns each dataset should have, both required and optional.

## Consumer-Producer dataset
This dataset contains information about the actual OutSystems dependencies between different modules and can be
extracted from the OutSystems internal database.
To do so, please run the query as defined in [OSdata_GetConsumerProducer.sql](OSdata_GetConsumerProducer.sql).
The resulting table can be imported into Arvisan.

Note that when you use multiple OutSystems environments, you need to run the query for each of the environments.
The input data parser will merge all these datasets into a single graph, but application and module names need
to be unique across environments.

## Module details dataset
This dataset contains detailed information about each module, for example their file size or the number of entities.
Just like the Consumer-Producer dataset, this dataset can be taken directly from an OutSystems internal database.
To do so, please run the query as defined in [OSdata_GetModuleInfoCounts.sql](OSdata_GetModuleInfoCounts.sql).
The resulting table can be imported into Arvisan.

Note that when you use multiple OutSystems environments, you need to run the query for each of the environments.
The input data parser will merge all these datasets into a single graph, but application and module names need
to be unique across environments.

## Application group dataset
This dataset contains the grouping of applications into functional domains and modules into layers.
The data can be taken from [Discovery](https://www.outsystems.com/forge/component-overview/409/discovery-o11) or a
different tool that classifies modules into functional domains and/or layers.
In Discovery, you have to download a "Modules Report" from the "All Modules" page.
The resulting `xlsx` file can then be imported into Arvisan.

## Integration dataset
This dataset should contain a summary of trace logs of a chosen timespan.
Each row should correspond to one endpoint of one module and whether it is consuming or producing.
The input data parser will try to match consumers and producers based on the method name.
Logs can be either from so-called integrations or OutSystems Service API calls.

During development, the data was taken from Dynatrace.
However, because the source of such data can differ greatly per organization and because the current
matching method is very limited, no example query is included.
