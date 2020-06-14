"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const nexus_extend_1 = require("@nexus-switchboard/nexus-extend");
const docDiscoveryJob_1 = require("./jobs/docDiscoveryJob");
const config_1 = tslib_1.__importDefault(require("./lib/config"));
const confluence_1 = require("./lib/search/confluence");
const commands_1 = require("./lib/slack/commands");
const routes_1 = tslib_1.__importDefault(require("./routes"));
const events_1 = require("./lib/slack/events");
exports.logger = debug_1.default("nexus:dox");
/**
 * This is the main module object for Dox.  It will return configuration information, route
 * information, connection information and anything else necessary to initialize and manage
 * the module.
 */
class DoxModule extends nexus_extend_1.NexusModule {
    constructor() {
        super(...arguments);
        this.name = "dox";
    }
    getConfigRules() {
        return config_1.default;
    }
    loadConfig(config) {
        return config;
    }
    loadRoutes(_config) {
        return routes_1.default;
    }
    // the user will define job instance in the .nexus file.  Nexus will pass that configuration into
    //  this loader.  Use the type to identify the right job class and instantiate it with the configuration
    //  object given.  Return instances to the nexus core which will manage them from there.
    loadJobs(jobsDefinition) {
        return jobsDefinition.map((c) => {
            if (c.type === "doc_discovery") {
                return new docDiscoveryJob_1.DocDiscoveryJob(c);
            }
            else {
                throw new Error(`Received unexpected job type '${c.type}'`);
            }
        });
    }
    // most modules will use at least one connection.  This will allow the user to instantiate the connections
    //  and configure them using configuration that is specific to this module.
    loadConnections(config, subApp) {
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
                            subCommandListeners: commands_1.subCommands
                        }],
                    eventListeners: events_1.events,
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
            }
        ];
    }
    getConfluence() {
        return this.getActiveConnection("nexus-conn-confluence");
    }
    getSendgrid() {
        return this.getActiveConnection("nexus-conn-sendgrid");
    }
    getSlack() {
        return this.getActiveConnection("nexus-conn-slack");
    }
    /**
     * Retrieve a list of the configured search sources.  If the list has not been created
     * yet, it will be created and returned.  The source list uses the DOCUMENTATION_SOURCES
     * configuration value to prepare the list.  There are two types of sources:
     *      * confluence
     *      * github
     */
    getSearchSources() {
        if (!this._sources) {
            this._sources = [];
            this._sources = this.getActiveModuleConfig().DOCUMENTATION_SOURCES.map((src) => {
                if (src.type === "confluence") {
                    const confluenceSource = new confluence_1.ConfluenceSource();
                    if (src.parentPageId) {
                        confluenceSource.addParentPage(src.parentPageId);
                    }
                    else if (src.spaceKey) {
                        confluenceSource.addSpace(src.spaceKey);
                    }
                    this._sources.push(confluenceSource);
                }
            });
        }
        return this._sources;
    }
}
exports.default = new DoxModule();
//# sourceMappingURL=index.js.map