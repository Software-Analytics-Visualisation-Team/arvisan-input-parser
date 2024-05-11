"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const root_parser_1 = __importDefault(require("./root-parser"));
class ApplicationGroupParser extends root_parser_1.default {
    constructor(entries, includeModuleLayerLayer) {
        super(includeModuleLayerLayer);
        entries.forEach((e, i, all) => {
            const foundIndex = all
                .findIndex((e2) => e.Application === e2.Application
                && e.Module === e2.Module);
            // This entry exists twice in the dataset (meaning in two domains), but it can
            // be part of only one domain. Therefore, skip this entry (quick 'n dirty fix)
            if (i !== foundIndex)
                return;
            let domainNode;
            if (e.Domain) {
                const domainId = this.getDomainId(e.Domain);
                domainNode = this.getNode(domainId);
                if (domainNode == null) {
                    domainNode = this.createDomainNode(e.Domain);
                    this.nodes.push(domainNode);
                }
            }
            this.getApplicationAndModule(e.Application, e.Module, domainNode, e.Layer);
        });
    }
}
exports.default = ApplicationGroupParser;
//# sourceMappingURL=application-group-parser.js.map