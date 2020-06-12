import { Application } from 'express';
import createDebug from "debug";

import {ConfluenceConnection} from "@nexus-switchboard/nexus-conn-confluence";
import {SendgridConnection} from "@nexus-switchboard/nexus-conn-sendgrid";
import {SlackConnection} from "@nexus-switchboard/nexus-conn-slack";

import {
    ConnectionRequest,
    IRouteDefinition, Job,
    NexusJobDefinition,
    NexusModule,
    ModuleConfig, IConfigGroups
} from "@nexus-switchboard/nexus-extend";

import {DocDiscoveryJob} from "./jobs/docDiscoveryJob";
import configRules from "./lib/config";

import {subCommands} from "./lib/slack/commands";
import routes from "./routes";
import { events } from "./lib/slack/events";

export const logger = createDebug("nexus:dox");

/**
 * This is the main module object for Dox.  It will return configuration information, route
 * information, connection information and anything else necessary to initialize and manage
 * the module.
 */
class DoxModule extends NexusModule {

    public name = "dox";

    protected getConfigRules(): IConfigGroups {
        return configRules;
    }

    public loadConfig(config?: ModuleConfig): ModuleConfig {
        return config;
    }

    public loadRoutes(_config: ModuleConfig): IRouteDefinition[] {
        return routes;
    }

    // the user will define job instance in the .nexus file.  Nexus will pass that configuration into
    //  this loader.  Use the type to identify the right job class and instantiate it with the configuration
    //  object given.  Return instances to the nexus core which will manage them from there.
    public loadJobs(jobsDefinition: NexusJobDefinition[]): Job[] {
        return jobsDefinition.map((c) => {
            if (c.type === "doc_discovery") {
                return new DocDiscoveryJob(c);
            } else {
                throw new Error(`Received unexpected job type '${c.type}'`);
            }
        });
    }

    // most modules will use at least one connection.  This will allow the user to instantiate the connections
    //  and configure them using configuration that is specific to this module.
    public loadConnections(config: ModuleConfig,
                           subApp: Application): ConnectionRequest[] {
        return [
            {
                name: "nexus-conn-confluence",
                config: {
                    host: config.CONFLUENCE_HOST,
                    username: config.CONFLUENCE_USERNAME,
                    apiToken: config.CONFLUENCE_API_KEY
                },
            },
            {
                name: "nexus-conn-slack",
                config: {
                    appId: config.SLACK_APP_ID,
                    clientId: config.SLACK_CLIENT_ID,
                    clientSecret: config.SLACK_CLIENT_SECRET,
                    signingSecret: config.SLACK_SIGNING_SECRET,
                    commands: [{
                        command: "dox",
                        subCommandListeners: subCommands
                    }],
                    eventListeners: events,
                    incomingWebhooks: [],
                    subApp,
                }
            },
            {
                name: "nexus-conn-github",
                config: {
                    apiToken: config.GITHUB_API_TOKEN,
                    baseUrl: config.GITHUB_BASE_URL
                }
            },
            {
                name: "nexus-conn-sendgrid",
                config: {
                    apiKey: config.SENDGRID_API_KEY
                }
            }];
    }

    public getConfluence(): ConfluenceConnection {
        return this.getActiveConnection("nexus-conn-confluence") as ConfluenceConnection;
    }

    public getSendgrid(): SendgridConnection {
        return this.getActiveConnection("nexus-conn-sendgrid") as SendgridConnection;
    }

    public getSlack(): SlackConnection {
        return this.getActiveConnection("nexus-conn-slack") as SlackConnection;
    }
}

export default new DoxModule();
