import RootParser from './root-parser';
import { ApplicationGroupEntry } from './outsystems-arch-canvas';

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

      const domainId = this.getDomainId(e.ApplicationGroupName);
      let domainNode = this.getNode(domainId);
      if (domainNode == null) {
        domainNode = this.createDomainNode(e.ApplicationGroupName);
        this.nodes.push(domainNode);
      }

      const appId = this.getApplicationId(e.ApplicationName);
      let appNode = this.getNode(appId);
      if (appNode == null) {
        appNode = this.createApplicationNode(e.ApplicationName);
        const {
          nodes: layerNodes, edges: layerEdges,
        } = this.getApplicationModuleLayerNodesAndEdges([appNode], includeModuleLayerLayer);
        const domainContainEdge = this.createContainEdge(domainNode, appNode);
        this.nodes.push(appNode, ...layerNodes);
        this.containEdges.push(domainContainEdge, ...layerEdges);
      }

      const moduleId = this.getModuleId(e.ApplicationName, e.ModuleName);
      let moduleNode = this.getNode(moduleId);
      if (moduleNode == null) {
        moduleNode = this.createModuleNode(e.ApplicationName, e.ModuleName);
        const domainContainEdge = this.createContainEdge(domainNode, appNode);
        this.nodes.push(appNode);
        this.containEdges.push(domainContainEdge);
      }
    });
  }
}
