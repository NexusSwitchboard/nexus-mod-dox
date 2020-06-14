"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const docDiscoveryJob_1 = require("./docDiscoveryJob");
exports.default = (nexusJobs) => {
    return nexusJobs.map((c) => {
        if (c.type === "doc_discovery") {
            return new docDiscoveryJob_1.DocDiscoveryJob(c);
        }
        else {
            throw new Error(`Received unexpected job type '${c.type}'`);
        }
    });
};
//# sourceMappingURL=index.js.map