import {Content} from "ts-confluence-client/dist/resources/types";
import {SlackConnection, ISlackAckResponse, SlackSubCommandList} from "@nexus-switchboard/nexus-conn-slack";
import {getNestedVal, replaceAll} from "@nexus-switchboard/nexus-extend";
import {checkPagesForOutOfDateContent} from "./index";
import {doDefaultSearch, IConfluenceSearchResult} from "./search";
import moduleInstance from "../"
import {logger} from "../"

export const subCommands: SlackSubCommandList = {

    help: async (_conn: SlackConnection, _textWithoutAction: string,
                 _slackParams: Record<string, any>): Promise<ISlackAckResponse> => {
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
    },
    stale: async (conn: SlackConnection, textWithoutAction: string,
                  slackParams: Record<string, any>): Promise<ISlackAckResponse> => {
        const params = textWithoutAction.split(" ");
        if (params.length === 0) {
            return {
                code: 200,
                body: {
                    text: ":x: You must at least specify a confluence page ID for this command"
                }
            };
        }

        checkPagesForOutOfDateContent({
            parentPageId: params[0],
            staleDocumentAfterInDays: params.length > 1 ? parseInt(params[1], 10) : 60,
            sendFrom: "",
            sendAdminEmail: false,
            sendOwnerEmail: false,
            adminInfo: {name: "", email: ""}
        })
            .then((pages) => {
                const config = moduleInstance.getActiveModuleConfig();

                const blocks: Record<string, any> = pages.map((page: Content) => {
                    return {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `:page_with_curl: *${page.title}*`
                        },
                        accessory: {
                            type: "button",
                            text: {
                                type: "plain_text",
                                text: "Open"
                            },
                            url: `${config.CONFLUENCE_HOST}${getNestedVal(page, "_links.webui")}`
                        }
                    };
                });

                if (blocks.length === 0) {
                    // add the title section.
                    blocks.unshift({
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `:tada: *There were no stale documents found!*`
                        }
                    });
                } else {
                    blocks.unshift({
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `:warning: *Here are the pages that we consider "stale" at this point:*`
                        }
                    });
                }

                return conn.sendMessageResponse(slackParams, {blocks});

            })
            .catch((reason) => {
                return conn.sendMessageResponse(slackParams, {
                    text: ":x: There was a problem retrieving stale doc data: " + reason
                });
            });

        return {
            code: 200,
            body: {
                text: ":gear: Checking..."
            }
        };
    },

    search: async (conn: SlackConnection, textWithoutAction: string,
                   slackParams: Record<string, any>): Promise<ISlackAckResponse> => {
        logger("Got here");
        doDefaultSearch(textWithoutAction)
            .then((searchResults) => {
                const config = moduleInstance.getActiveModuleConfig();

                const blocks = searchResults.results.map((result: IConfluenceSearchResult) => {
                    const excerptFormatted = replaceAll(result.excerpt, {
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
                            url: `${config.CONFLUENCE_HOST}${getNestedVal(result, "pageInfo._links.webui")}`
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
                } else {
                    // add the title section.
                    blocks.unshift({
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `*Here are some of the results found for the query "${textWithoutAction}":*`
                        }
                    });
                }

                return conn.sendMessageResponse(slackParams, {blocks});

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
    }
};
