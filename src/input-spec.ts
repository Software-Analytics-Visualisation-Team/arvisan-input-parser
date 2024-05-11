/**
 * This file contains the specifications of the input files that this script requires.
 * More specifically, each specification contains the exact names of the columns that
 * need to be present in their respective files. If a column is missing, this might
 * cause errors.
 *
 * According to the OutSystems specification, all applications and all modules present
 * in an OutSystems environment have a unique name across that environment. Do note
 * however that the tool supports multiple environments. If there are however duplicates
 * (for example: a module belongs in two applications or an application belongs in two
 * domains), only the first containment is used. All the others are ignored.
 */

/**
 * Dataset of dependencies between two modules.
 *
 * PrimaryKey: [Cons_Application, Cons_Module, Prod_Application, Prod_Module, Reference_Name]
 * CLI option: --dependencies <files>
 * Required: no
 */
export interface ConsumerProducerEntry {
  'Cons_Application': string // Unique consumer application name
  'Cons_Module': string // Unique consumer module name (that belongs to the consumer application)
  'Prod_Application': string // Unique producer application name
  'Prod_Module': string // Unique Consumer module name (that belongs to the producer application)
  'Reference_Name': string // Name of the reference, e.g. GetObjects
  'Reference_Kind': string // Type of reference, e.g. Action, Entity, etc
}

/**
 * Dataset of "containment" of modules within applications and applications within domains.
 *
 * Primary key: [Application, Module]
 * CLI option: --grouping <files>
 * Required: no
 */
export interface ApplicationGroupEntry {
  /** Name of the functional domain */
  Domain?: string;
  /** Name of the application */
  Application: string;
  /** Optional name of the sublayer, should be one of ./src/structure.ts::ModuleSublayer */
  Layer?: string;
  /** Name of the module */
  Module: string;
}

/**
 * Dataset of dynamic data that summarizes API calls, both unregistered in OutSystems
 * (integrations) and registered (ServiceAPI). Producers/consumers are matched based on
 * their EndpointAndMethod and direction.
 *
 * Primary key: [ApplicationName, ModuleName, EndpointAndMethod].
 * CLI option: --integrations <files>
 * Required: no
 */
export interface IntegrationServiceAPIEntry {
  ApplicationName: string, // Application name
  ModuleName: string, // Module name
  EndpointAndMethod: string, // Name of the endpoint/method that this integration uses
  direction: 'REST (Consume)' | 'REST (Expose)' | string, // Direction of the endpoint
  logtype: 'Integration' | 'ServiceAPI', // Type of log, should be one of the two
  count: number, // How many times this EndpointAndMethod has been called in the given timeframe
}

/**
 * Dataset that contains more details about modules within OutSystems. This dataset
 * is not merged with the ConsumerProducer dataset, because the latter might contain
 * multiple records of the same Consumer-Producer pairs (because of multiple
 * different dependencies).
 *
 * Primary key: [ApplicationName, ModuleName]
 * CLI option: --moduleDetails <files>
 * Required: no
 */
export interface ModuleDetailsEntry {
  'ApplicationName': string;
  'ModuleName': string;
  'FileSizeKB': number;
  'Count_Screens': number;
  'Count_Entities': number;
  'Count_PublicElements': number;
  'Count_REST_Consumer': number;
  'Count_REST_Producer': number;
  'Count_BPTProcessDef': number;
}
