import {Job, NexusJobDefinition} from "@nexus-switchboard/nexus-extend";
import {DocDiscoveryJob} from "./docDiscoveryJob";

export default (nexusJobs: NexusJobDefinition[]): Job[] => {
    return nexusJobs.map((c) => {
        if (c.type === "doc_discovery") {
            return new DocDiscoveryJob(c);
        } else {
            throw new Error(`Received unexpected job type '${c.type}'`);
        }
    });
};
