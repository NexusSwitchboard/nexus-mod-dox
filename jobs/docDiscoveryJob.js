"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const nexus_extend_1 = require("@nexus-switchboard/nexus-extend");
const turndown_1 = tslib_1.__importDefault(require("turndown"));
const moment_1 = tslib_1.__importDefault(require("moment"));
const __1 = tslib_1.__importDefault(require(".."));
const __2 = require("..");
class DocDiscoveryJob extends nexus_extend_1.Job {
    constructor() {
        super(...arguments);
        this.name = "doc_discovery";
        this.requiredOptions = ["CONFLUENCE_PARENT_PAGE_ID", "SLACK_POSTING_URL"];
    }
    /**
     * Clears the children of the given page of all "didjaknow" property data.  This can be used
     * in cases where you want to reset the timers so that all articles get pretty much the same
     * opportunity to be selected.
     * @param pageId The ID of the page whose children should be cleared of didjaknow data
     */
    static cleanChildPages(pageId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const cc = __1.default.getConfluence();
            const collection = yield cc.api.content.getChildPages(pageId, []);
            if (collection && collection.size && (collection.size > 0)) {
                yield collection.results.map((c) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    try {
                        const result = yield cc.api.content.upsertContentProperty(c.id, "didjaknow", { cleaned: true }, true);
                        __2.logger(result);
                    }
                    catch (e) {
                        __2.logger(e.message);
                    }
                }));
            }
            return true;
        });
    }
    /**
     * This will use a weighted sysmtem for selecting a child page and optionally notify a slack channel if a channel
     * is given.
     * @param parentPageId The ID of the parent page.
     * @param slackChannel The slack channel (Optional)
     * @param adminEmail
     */
    selectChildPage(parentPageId, slackChannel, adminEmail) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const cc = __1.default.getConfluence();
            const email = __1.default.getSendgrid();
            const sendSlack = !!slackChannel;
            const page = yield this.getRandomPage(cc, parentPageId);
            if (page) {
                let pageDetails = null;
                // If the returned page doesn't have body content, make another call to get it.
                if (!page.hasOwnProperty("body") || !!page.body) {
                    pageDetails = yield cc.api.content.getContentById(page.id, ["body.storage"]);
                }
                else {
                    pageDetails = page;
                }
                // post to slack
                if (sendSlack) {
                    yield this.sendToSlack(slackChannel, pageDetails);
                }
                if (adminEmail) {
                    try {
                        yield email.send({
                            to: "kshehadeh@ua.com",
                            from: adminEmail,
                            subject: `Didjaknow Post completed for page ${parentPageId}`,
                            text: `Didjaknow posted: ${page.title}`
                        });
                    }
                    catch (e) {
                        __2.logger("Unable to send email.  Failed with the following error: " + e.message);
                    }
                }
                return pageDetails;
            }
            return null;
        });
    }
    _run() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return this.selectChildPage(this.definition.options.CONFLUENCE_PARENT_PAGE_ID, this.definition.options.SLACK_POSTING_URL, this.definition.options.ADMIN_EMAIL)
                .then(() => {
                return true;
            }).catch((e) => {
                __2.logger(`Failed ${this.name} job: ${e.message}`);
                return false;
            });
        });
    }
    /**
     * Takes an array of page objects, filters out the  pages  that were updated recently then  scores the remaining
     * docs.  The higher the score, the more relevant the story taking into account when it was last updated,
     * how frequently it has been chosen and when it was last chosen.  It then sorts the list in descending order
     * and takes the top X stories and randomly selects one then updates the properties to reflect the new selection.
     * @param arr
     */
    filterWeightAndSort(arr) {
        const MAX_AGE_DAYS = 7;
        const beforeDate = moment_1.default().subtract(MAX_AGE_DAYS, "days");
        return arr.filter((value) => {
            // remove any docs that have been selected in the last week.
            const didjaknowData = nexus_extend_1.getNestedVal(value, "metadata.properties.didjaknow.value");
            if (didjaknowData) {
                const lastUseDate = didjaknowData.lastAccessed ? moment_1.default(didjaknowData.lastAccessed) : null;
                return !lastUseDate || (beforeDate > lastUseDate);
            }
            else {
                return true;
            }
        }).map((value) => {
            // Score each page
            const weightedValue = Object.assign({}, value);
            weightedValue.score = 0;
            try {
                const didjaknowData = nexus_extend_1.getNestedVal(value, "metadata.properties.didjaknow.value");
                const lastUseDate = didjaknowData && didjaknowData.lastAccessed ? moment_1.default(didjaknowData.lastAccessed) : null;
                const lastUpdatedDate = value.history.lastUpdated.when ?
                    moment_1.default(value.history.lastUpdated.when) : null;
                const daysSinceLastUpdate = lastUpdatedDate ? moment_1.default().diff(lastUpdatedDate, "days") : 100;
                const daysSinceLastUse = lastUseDate ? moment_1.default().diff(lastUseDate, "days") : 0;
                const useCount = didjaknowData && didjaknowData.useCount ? didjaknowData.useCount : 0;
                // high score indicates higher odds of being selected for display
                weightedValue.score = ((-daysSinceLastUpdate) + daysSinceLastUse + (-useCount));
            }
            catch (e) {
                __2.logger("There was a problem with the properties in one of the page objects: " + e.message);
            }
            return weightedValue;
        }).sort((a, b) => {
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
    getRandomPage(confluence, parentPageId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const collection = yield confluence.api.content.getChildPages(parentPageId, ["metadata.labels", "metadata.properties.didjaknow", "history.lastUpdated"]);
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
                        lastAccessed: moment_1.default().format(),
                        useCount
                    };
                    if (useCreate) {
                        yield confluence.api.content.createContentProperty(selectedPage.id, "didjaknow", propValue);
                    }
                    else {
                        yield confluence.api.content.updateContentProperty(selectedPage.id, "didjaknow", propValue);
                    }
                }
                catch (e) {
                    __2.logger("Failed to update the content property: " + e.message);
                }
                return selectedPage;
            }
            return null;
        });
    }
    sendToSlack(slackChannel, pageDetails) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const slack = __1.default.getSlack();
            try {
                const turndownService = new turndown_1.default();
                // Remove atlassian tags that are not useful to us at all here.
                turndownService.remove((node) => {
                    return node.nodeName === "AC:PARAMETER";
                });
                const markdown = turndownService.turndown(pageDetails.body.storage.value);
                yield slack.sendToIncomingWebhook(slackChannel, {
                    attachments: [
                        {
                            footer: ":bulb: Add your own: https://underarmour.atlassian.net/wiki/x/TelpDQ",
                            text: markdown,
                            title: pageDetails.title,
                            title_link: `${process.env.CONFLUENCE_HOST}${pageDetails._links.tinyui}`,
                        }
                    ],
                });
            }
            catch (e) {
                __2.logger("Slack webhook send failed with " + e.message);
            }
        });
    }
}
exports.DocDiscoveryJob = DocDiscoveryJob;
//# sourceMappingURL=docDiscoveryJob.js.map