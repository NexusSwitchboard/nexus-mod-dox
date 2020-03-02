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
    ModuleConfig
} from "@nexus-switchboard/nexus-extend";

import {DocDiscoveryJob} from "./jobs/docDiscoveryJob";
import {DoxStaleCheckJob} from "./jobs/staleCheckJob";

import {subCommands} from "./lib/slack";
import routes from "./routes";

export const logger = createDebug("nexus:dox");

class DoxModule extends NexusModule {

    public name = "dox";

    public loadConfig(overrides?: ModuleConfig): ModuleConfig {
        const defaults = {
            SLACK_APP_ID: "__env__",
            SLACK_CLIENT_ID: "__env__",
            SLACK_CLIENT_SECRET: "__env__",
            SLACK_SIGNING_SECRET: "__env__",

            CONFLUENCE_HOST: "__env__",
            CONFLUENCE_USERNAME: "__env__",
            CONFLUENCE_API_KEY: "__env__",

            SENDGRID_API_KEY: "__env__",
        };

        return overrides ? Object.assign({}, defaults, overrides) : {...defaults};
    }

    public loadRoutes(_config: ModuleConfig): IRouteDefinition[] {
        return routes;
    }

    // the user will define job instance in the .nexus file.  Nexus will pass that configuration into
    //  this loader.  Use the type to identify the right job class and instantiate it with the configuration
    //  object given.  Return instances to the nexus core which will manage them from there.
    public loadJobs(jobsDefinition: NexusJobDefinition[]): Job[] {
        return jobsDefinition.map((c) => {
            if (c.type === "staleness_checker") {
                return new DoxStaleCheckJob(c);
            } else if (c.type === "doc_discovery") {
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
                    incomingWebhooks: [],
                    subApp,
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
