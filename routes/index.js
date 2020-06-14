"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const docDiscoveryJob_1 = require("../jobs/docDiscoveryJob");
const search_1 = require("../lib/search");
const routes = [
    {
        method: "get",
        protected: false,
        path: "/discovery/:parentPageId/clean",
        handler: (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const pagesCleaned = yield docDiscoveryJob_1.DocDiscoveryJob.cleanChildPages(req.params.parentPageId);
            return res.json({
                success: pagesCleaned,
            }).status(200);
        })
    },
    {
        method: "get",
        protected: false,
        path: "/search",
        handler: (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            return res.json(search_1.doDefaultSearch(req.query.q));
        })
    }
];
exports.default = routes;
//# sourceMappingURL=index.js.map