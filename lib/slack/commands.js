"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const nexus_extend_1 = require("@nexus-switchboard/nexus-extend");
const search_1 = require("../search");
const index_1 = tslib_1.__importDefault(require("../../index"));
const index_2 = require("../../index");
exports.subCommands = {
    help: (_conn, _textWithoutAction, _slackParams) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        return {
            code: 200,
            body: {
                text: "The `dox` command gives you access to advanced documentation capabilities made available through integrations with third-party documentation sources.",
                attachments: [
                    {
                        color: "#FF0000",
                        title: "search",
                        text: `Does a targeted search of documentation sources as configured 
                                    in the dox module in Nexus`,
                        fields: [
                            {
                                title: "Paramer #1",
                                value: "The search query",
                                short: false
                            }
                        ]
                    },
                    {
                        color: "#00FF00",
                        title: "stale",
                        text: "Returns a list of stale documents under the given Confluence page",
                        fields: [
                            {
                                title: "Paramer #1",
                                value: "Confluence page ID",
                                short: false
                            },
                            {
                                title: "Paramer #2",
                                value: "#of days after which a document is considered stale",
                                short: false
                            }
                        ]
                    }
                ]
            }
        };
    }),
    search: (conn, textWithoutAction, slackParams) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        index_2.logger("Got here");
        search_1.doDefaultSearch(textWithoutAction)
            .then((searchResults) => {
            const config = index_1.default.getActiveModuleConfig();
            const blocks = searchResults.results.map((result) => {
                const excerptFormatted = nexus_extend_1.replaceAll(result.excerpt, {
                    "@@@hl@@@": "*",
                    "@@@endhl@@@": "*",
                    "\n": "   "
                });
                return {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `:page_with_curl: *${result.name}*\n${excerptFormatted}`
                    },
                    accessory: {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Open"
                        },
                        url: `${config.CONFLUENCE_HOST}${nexus_extend_1.getNestedVal(result, "pageInfo._links.webui")}`
                    }
                };
            });
            if (blocks.length === 0) {
                // add the title section.
                blocks.unshift({
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `:disappointed: *There were no results found for query "${textWithoutAction}"*`
                    }
                });
            }
            else {
                // add the title section.
                blocks.unshift({
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Here are some of the results found for the query "${textWithoutAction}":*`
                    }
                });
            }
            return conn.sendMessageResponse(slackParams, { blocks });
        })
            .catch((err) => {
            return conn.sendMessageResponse(slackParams, {
                text: "There was a problem retrieving data: " + err.message
            });
        });
        return {
            code: 200,
            body: {
                text: ":mag: Searching..."
            }
        };
    })
};
//# sourceMappingURL=commands.js.map