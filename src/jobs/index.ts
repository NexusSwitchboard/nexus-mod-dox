import {Job, NexusJobDefinition} from "@nexus-switchboard/nexus-extend";
import {DocDiscoveryJob} from "./docDiscoveryJob";
import {DoxStaleCheckJob} from "./staleCheckJob";

export default (nexusJobs: NexusJobDefinition[]): Job[] => {
    return nexusJobs.map((c) => {
        if (c.type === "staleness_checker") {
            return new DoxStaleCheckJob(c);
        } else if (c.type === "doc_discovery") {
            return new DocDiscoveryJob(c);
        } else {
            throw new Error(`Received unexpected job type '${c.type}'`);
        }
    });
};
