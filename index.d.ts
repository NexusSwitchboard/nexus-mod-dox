import { Application } from 'express';
import createDebug from "debug";
import { ConfluenceConnection } from "@nexus-switchboard/nexus-conn-confluence";
import { SendgridConnection } from "@nexus-switchboard/nexus-conn-sendgrid";
import { SlackConnection } from "@nexus-switchboard/nexus-conn-slack";
import { ConnectionRequest, IRouteDefinition, Job, NexusJobDefinition, NexusModule, ModuleConfig, IConfigGroups } from "@nexus-switchboard/nexus-extend";
import { SearchSource } from "./lib/search";
export declare const logger: createDebug.Debugger;
/**
 * This is the main module object for Dox.  It will return configuration information, route
 * information, connection information and anything else necessary to initialize and manage
 * the module.
 */
declare class DoxModule extends NexusModule {
    name: string;
    _sources: SearchSource[];
    protected getConfigRules(): IConfigGroups;
    loadConfig(config?: ModuleConfig): ModuleConfig;
    loadRoutes(_config: ModuleConfig): IRouteDefinition[];
    loadJobs(jobsDefinition: NexusJobDefinition[]): Job[];
    loadConnections(config: ModuleConfig, subApp: Application): ConnectionRequest[];
    getConfluence(): ConfluenceConnection;
    getSendgrid(): SendgridConnection;
    getSlack(): SlackConnection;
    /**
     * Retrieve a list of the configured search sources.  If the list has not been created
     * yet, it will be created and returned.  The source list uses the DOCUMENTATION_SOURCES
     * configuration value to prepare the list.  There are two types of sources:
     *      * confluence
     *      * github
     */
    getSearchSources(): SearchSource[];
}
declare const _default: DoxModule;
export default _default;
