import {ConfluenceConnection} from "@nexus-switchboard/nexus-conn-confluence";
import {EmailAddress} from "@nexus-switchboard/nexus-conn-sendgrid";
import {getNestedVal, Job} from "@nexus-switchboard/nexus-extend";

import TurndownService from "turndown";
import moment from "moment";
import {Content} from "ts-confluence-client/dist/resources/types";
import moduleInstance from "..";
import {logger} from "..";

type WeightedContent = Content & { score: number };

export class DocDiscoveryJob extends Job {

    /**
     * Clears the children of the given page of all "didjaknow" property data.  This can be used
     * in cases where you want to reset the timers so that all articles get pretty much the same
     * opportunity to be selected.
     * @param pageId The ID of the page whose children should be cleared of didjaknow data
     */
    public static async cleanChildPages(pageId: string): Promise<boolean> {
        const cc = moduleInstance.getConfluence();
        const collection = await cc.api.content.getChildPages(pageId, []);

        if (collection && collection.size && (collection.size > 0)) {
            await collection.results.map(async (c) => {
                try {
                    const result = await cc.api.content.upsertContentProperty(c.id, "didjaknow",
                        {cleaned: true}, true);
                    logger(result);
                } catch (e) {
                    logger(e.message);
                }
            });
        }
        return true;
    }

    public name = "doc_discovery";
    protected requiredOptions = ["CONFLUENCE_PARENT_PAGE_ID", "SLACK_POSTING_URL"];

    /**
     * This will use a weighted sysmtem for selecting a child page and optionally notify a slack channel if a channel
     * is given.
     * @param parentPageId The ID of the parent page.
     * @param slackChannel The slack channel (Optional)
     * @param adminEmail
     */
    public async selectChildPage(parentPageId: string, slackChannel?: string,
                                 adminEmail?: EmailAddress): Promise<Record<string, any>> {
        const cc = moduleInstance.getConfluence();
        const email = moduleInstance.getSendgrid();

        const sendSlack: boolean = !!slackChannel;
        const page = await this.getRandomPage(cc, parentPageId);
        if (page) {
            let pageDetails: Content = null;
            // If the returned page doesn't have body content, make another call to get it.
            if (!page.hasOwnProperty("body") || !!page.body) {
                pageDetails = await cc.api.content.getContentById(page.id, ["body.storage"]);
            } else {
                pageDetails = page;
            }

            // post to slack
            if (sendSlack) {
                await this.sendToSlack(slackChannel, pageDetails);
            }

            if (adminEmail) {
                try {
                    await email.send({
                        to: "kshehadeh@ua.com",
                        from: adminEmail,
                        subject: `Didjaknow Post completed for page ${parentPageId}`,
                        text: `Didjaknow posted: ${page.title}`
                    });
                } catch (e) {
                    logger("Unable to send email.  Failed with the following error: " + e.message);
                }
            }

            return pageDetails;
        }

        return null;
    }

    protected async _run(): Promise<boolean> {

        return this.selectChildPage(this.definition.options.CONFLUENCE_PARENT_PAGE_ID,
            this.definition.options.SLACK_POSTING_URL, this.definition.options.ADMIN_EMAIL)
            .then(() => {
                return true;
            }).catch((e) => {
                logger(`Failed ${this.name} job: ${e.message}`);
                return false;
            });
    }

    /**
     * Takes an array of page objects, filters out the  pages  that were updated recently then  scores the remaining
     * docs.  The higher the score, the more relevant the story taking into account when it was last updated,
     * how frequently it has been chosen and when it was last chosen.  It then sorts the list in descending order
     * and takes the top X stories and randomly selects one then updates the properties to reflect the new selection.
     * @param arr
     */
    protected filterWeightAndSort(arr: Content[]) {
        const MAX_AGE_DAYS = 7;
        const beforeDate = moment().subtract(MAX_AGE_DAYS, "days");

        return arr.filter((value: Content) => {
            // remove any docs that have been selected in the last week.
            const didjaknowData = getNestedVal(value, "metadata.properties.didjaknow.value");
            if (didjaknowData) {
                const lastUseDate = didjaknowData.lastAccessed ? moment(didjaknowData.lastAccessed!) : null;
                return !lastUseDate || (beforeDate > lastUseDate);
            } else {
                return true;
            }
        }).map((value: Content) => {

            // Score each page
            const weightedValue = Object.assign({}, value) as WeightedContent;
            weightedValue.score = 0;

            try {
                const didjaknowData = value.metadata.properties.didjaknow.value;
                const lastUseDate = didjaknowData.lastAccessed ? moment(didjaknowData.lastAccessed!) : null;

                const lastUpdatedDate = value!.history!.lastUpdated!.when ?
                    moment(value.history.lastUpdated.when) : null;

                const daysSinceLastUpdate = lastUpdatedDate ? moment().diff(lastUpdatedDate, "days") : 100;
                const daysSinceLastUse = lastUseDate ? moment().diff(lastUseDate, "days") : 0;
                const useCount = didjaknowData.useCount || 0;

                // high score indicates higher odds of being selected for display
                weightedValue.score = ((-daysSinceLastUpdate) + daysSinceLastUse + (-useCount));

            } catch (e) {
                logger("There was a problem with the properties in one of the page objects: " + e.message);
            }

            return weightedValue;

        }).sort((a: WeightedContent, b: WeightedContent) => {
            // highest will come first.
            return (a.score > b.score) ? -1 : (b.score > a.score) ? 1 : 0;
        });
    }

    /**
     * Given a api connection and a parent page ID, select a page based on criteria including
     * when a page was last picked, when it was last updated, and how often it has been picked.
     * @param confluence The api connection
     * @param parentPageId The ID of the api page to look for child pages in.
     */
    protected async getRandomPage(confluence: ConfluenceConnection, parentPageId: string) {
        const collection = await confluence.api.content.getChildPages(parentPageId,
            ["metadata.labels", "metadata.properties.didjaknow", "history.lastUpdated"]);

        if (collection && collection.size && (collection.size > 0)) {
            const sortedList = this.filterWeightAndSort(collection.results);

            if (sortedList.length === 0) {
                return undefined;
            }

            // randomly select from the top five
            const MAX_SEL = 5;
            const maxSel = sortedList.length < (MAX_SEL) ? sortedList.length : MAX_SEL;
            const randIndex = (Math.ceil(Math.random() * maxSel)) - 1;
            const selectedPage = sortedList[randIndex];

            const props = selectedPage.metadata.properties.didjaknow;
            const useCount = (props && props.value.useCount) ? props.value.useCount + 1 : 1;
            const useCreate = props === undefined;

            try {
                const propValue = {
                    lastAccessed: moment().format(),
                    useCount
                };

                if (useCreate) {
                    await confluence.api.content.createContentProperty(selectedPage.id, "didjaknow", propValue);
                } else {
                    await confluence.api.content.updateContentProperty(selectedPage.id, "didjaknow", propValue);
                }
            } catch (e) {
                logger("Failed to update the content property: " + e.message);
            }
            return selectedPage;
        }
        return null;
    }

    protected async sendToSlack(slackChannel: string, pageDetails: Content) {
        const slack = moduleInstance.getSlack();

        try {
            const turndownService = new TurndownService();
            // Remove atlassian tags that are not useful to us at all here.
            turndownService.remove((node) => {
                return node.nodeName === "AC:PARAMETER";
            });

            const markdown = turndownService.turndown(pageDetails.body.storage.value);
            await slack.sendToIncomingWebhook(slackChannel, {
                attachments: [
                    {
                        footer: ":bulb: Add your own: https://underarmour.atlassian.net/wiki/x/TelpDQ",
                        text: markdown,
                        title: pageDetails.title,
                        title_link: `${process.env.CONFLUENCE_HOST}${pageDetails._links.tinyui}`,
                    }
                ],
            });

        } catch (e) {
            logger("Slack webhook send failed with " + e.message);
        }
    }

}
