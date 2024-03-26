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
 * PrimaryKey: [Cons Application, Cons Espace, Prod Application, Prod Espace, Reference Name]
 * CLI option: --dependencies <files>
 * Required: yes
 */
export interface ConsumerProducerEntry {
  'Cons Application': string // Unique consumer application name
  'Cons Espace': string // Unique consumer module name (that belongs to the consumer application)
  'Prod Application': string // Unique producer application name
  'Prod Espace': string // Unique Consumer module name (that belongs to the producer application)
  'Reference Kind': string // Type of reference, e.g. Action, Entity, etc
  'Reference Name': string // Name of the reference, e.g. GetObjects
  // 'Reference SS Key': string // not used
}

/**
 * Dataset of "containment" of modules within applications and applications within domains.
 *
 * Primary key: [ApplicationGroupName, ApplicationName, ModuleName]
 * CLI option: --grouping <file>
 * Required: yes
 */
export interface ApplicationGroupEntry {
  ApplicationGroupName: string; // Functional domain name
  ApplicationName: string; // Application name
  // ModuleKind: string; // not used
  ModuleName: string; // Module name
}

/**
 * Dataset of dynamic data that summarizes API calls, both unregistered in OutSystems
 * (integrations) and registered (ServiceAPI). Producers/consumers are matched based on
 * their EndpointAndMethod and direction.
 *
 * Primary key: [ApplicationName, ModuleName, EndpointAndMethod].
 * CLI option: --integrations <file>
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
 * Primary key: [Application Name, Module Name]
 * CLI option: --moduleDetails
 * Required: no
 */
export interface ModuleDetailsEntry {
  'Application Name': string; // Application name
  'Module Name': string; // Module name
  'File Size KB': number;
  'Count Screens': number;
  'Count Entities': number;
  'Count Public Elements': number;
  'Count REST Consumer': number;
  'Count REST Producer': number;
  'Count BPT Process Def': number;
}
