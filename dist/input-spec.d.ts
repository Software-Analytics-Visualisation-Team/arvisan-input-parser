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
    'Cons_Application': string;
    'Cons_Module': string;
    'Prod_Application': string;
    'Prod_Module': string;
    'Reference_Name': string;
    'Reference_Kind': string;
}
/**
 * Dataset of "containment" of modules within applications and applications within domains.
 *
 * Primary key: [ApplicationGroupName, ApplicationName, ModuleName]
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
