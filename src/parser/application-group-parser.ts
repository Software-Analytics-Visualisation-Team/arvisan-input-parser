import RootParser from './root-parser';
import { ApplicationGroupEntry } from './outsystems-arch-canvas';
import { GraphLayers } from '../structure';

export default class ApplicationGroupParser extends RootParser {
  constructor(entries: ApplicationGroupEntry[], includeModuleLayerLayer: boolean) {
    super();

    entries.forEach((e, i, all) => {
      const foundIndex = all
        .findIndex((e2) => e.ApplicationName === e2.ApplicationName
          && e.ModuleName === e2.ModuleName);
      // This entry exists twice in the dataset (meaning in two domains), but it can
      // be part of only one domain. Therefore, skip this entry (quick 'n dirty fix)
      if (i !== foundIndex) return;

      if (e.ApplicationName === 'MyVopak2') {
        console.log('break');
      }

      const domainId = this.getDomainId(e.ApplicationGroupName);
      let domainNode = this.getNode(domainId);
      if (domainNode == null) {
        domainNode = this.createDomainNode(e.ApplicationGroupName);
        this.nodes.push(domainNode);
      }

      this.getApplicationAndModule(
        e.ApplicationName,
        e.ModuleName,
        includeModuleLayerLayer,
        domainNode,
      );
    });

    this.trim();

    const moduleNodes = this.nodes.filter((n) => n.data.labels.includes(GraphLayers.MODULE));
    this.colorNodeBasedOnParent(moduleNodes);
  }
}
