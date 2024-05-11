import RootParser from './root-parser';
import { ApplicationGroupEntry } from '../input-spec';
import { Node } from '../structure';

export default class ApplicationGroupParser extends RootParser {
  constructor(entries: ApplicationGroupEntry[], includeModuleLayerLayer: boolean) {
    super(includeModuleLayerLayer);

    entries.forEach((e, i, all) => {
      const foundIndex = all
        .findIndex((e2) => e.Application === e2.Application
          && e.Module === e2.Module);
      // This entry exists twice in the dataset (meaning in two domains), but it can
      // be part of only one domain. Therefore, skip this entry (quick 'n dirty fix)
      if (i !== foundIndex) return;

      let domainNode: Node | undefined;
      if (e.Domain) {
        const domainId = this.getDomainId(e.Domain);
        domainNode = this.getNode(domainId);
        if (domainNode == null) {
          domainNode = this.createDomainNode(e.Domain);
          this.nodes.push(domainNode);
        }
      }

      this.getApplicationAndModule(
        e.Application,
        e.Module,
        domainNode,
        e.Layer,
      );
    });
  }
}
