import RootParser from './root-parser';
import { ApplicationGroupEntry } from '../input-spec';
export default class ApplicationGroupParser extends RootParser {
    constructor(entries: ApplicationGroupEntry[], includeModuleLayerLayer: boolean);
}
