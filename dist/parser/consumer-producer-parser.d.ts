import { ConsumerProducerEntry, IntegrationServiceAPIEntry } from '../input-spec';
import RootParser from './root-parser';
export default class ConsumerProducerParser extends RootParser {
    constructor(consumerProducerEntries: ConsumerProducerEntry[], includeModuleLayerLayer: boolean, serviceAPIEntries?: IntegrationServiceAPIEntry[]);
}
