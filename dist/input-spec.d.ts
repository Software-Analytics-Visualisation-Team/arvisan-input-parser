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
    'Cons Application': string;
    'Cons Espace': string;
    'Prod Application': string;
    'Prod Espace': string;
    'Reference Kind': string;
    'Reference Name': string;
}
/**
 * Dataset of "containment" of modules within applications and applications within domains.
 *
 * Primary key: [ApplicationGroupName, ApplicationName, ModuleName]
 * CLI option: --grouping <file>
 * Required: yes
 */
export interface ApplicationGroupEntry {
    /** Name of the functional domain */
    ApplicationGroupName?: string;
    ApplicationName: string;
    /** Optional name of the sublayer, should be one of ./src/structure.ts::ModuleSublayer */
    SubLayerName?: string;
    ModuleName: string;
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
    ApplicationName: string;
    ModuleName: string;
    EndpointAndMethod: string;
    direction: 'REST (Consume)' | 'REST (Expose)' | string;
    logtype: 'Integration' | 'ServiceAPI';
    count: number;
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
    'Application Name': string;
    'Module Name': string;
    'File Size KB': number;
    'Count Screens': number;
    'Count Entities': number;
    'Count Public Elements': number;
    'Count REST Consumer': number;
    'Count REST Producer': number;
    'Count BPT Process Def': number;
}
