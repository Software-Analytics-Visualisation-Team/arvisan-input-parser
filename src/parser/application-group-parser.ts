import RootParser from './root-parser';
import { ApplicationGroupEntry } from '../input-spec';
import { GraphLayers, Node } from '../structure';

export default class ApplicationGroupParser extends RootParser {
  constructor(entries: ApplicationGroupEntry[], includeModuleLayerLayer: boolean) {
    super(includeModuleLayerLayer);

    entries.forEach((e, i, all) => {
      const foundIndex = all
        .findIndex((e2) => e.ApplicationName === e2.ApplicationName
          && e.ModuleName === e2.ModuleName);
      // This entry exists twice in the dataset (meaning in two domains), but it can
      // be part of only one domain. Therefore, skip this entry (quick 'n dirty fix)
      if (i !== foundIndex) return;

      let domainNode: Node | undefined;
      if (e.ApplicationGroupName) {
        const domainId = this.getDomainId(e.ApplicationGroupName);
        domainNode = this.getNode(domainId);
        if (domainNode == null) {
          domainNode = this.createDomainNode(e.ApplicationGroupName);
          this.nodes.push(domainNode);
        }
      }

      this.getApplicationAndModule(
        e.ApplicationName,
        e.ModuleName,
        domainNode,
        e.SubLayerName,
      );
    });
  }
}
