import RootParser from './root-parser';
import { IntegrationServiceAPIEntry } from '../input-spec';
export default class IntegrationParser extends RootParser {
    /**
     * @param entries List of integrations
     * @param includeModuleLayerLayer
     */
    constructor(entries: IntegrationServiceAPIEntry[], includeModuleLayerLayer: boolean);
    /**
     * Parse a set of integrations that likely belong together as a set of dependencies.
     * Each group has exactly one REST (Expose) entry (the producer) and one or more
     * REST (Consume) entries (the consumers)
     * @param group
     * @private
     */
    private parseGroupedIntegration;
}
