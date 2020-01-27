import {Content} from "ts-confluence-client/dist/resources/types";
import moduleInstance, {logger} from "..";
import {IStaleCheckDetails} from "../jobs/staleCheckJob";
import {sendAdminEmail, sendOwnerEmails} from "./comms";
import {CUSTOM_PROP_NAME} from "./types";
import moment = require("moment");

/**
 * Filters a list of content down to only those items that are out of date.
 * @param pages The full list of content to filter
 * @param beforeDate The update date before which content is considered to be out of date.
 */
function getOutOfDateContent(pages: Content[], beforeDate: moment.MomentInput) {
    return pages.filter((page: Content) => {
        const lastUpdatedOb = moment(page.history.lastUpdated.when);
        return lastUpdatedOb.isBefore(beforeDate);
    });
}

/**
 * Using the updater config given, this will iterate through all the pages in the given  parent page and determine
 * who the owner is and, if the doc has not been updated in the configured # of days, it will be added to a list
 * of un-updated docs.  We can optionally send a notification to each owner for each page  or send a full list
 * to the curator (admin) for that parent page.
 * @param options
 */
export const checkPagesForOutOfDateContent = async (options: IStaleCheckDetails): Promise<Content[]> => {

    const confluenceConnection = moduleInstance.getConfluence();

    try {

        const beforeDate = moment().subtract(options.staleDocumentAfterInDays, "days");
        const pages = await confluenceConnection.api.content.getChildPages(options.parentPageId,
            ["metadata.properties." + CUSTOM_PROP_NAME, "history.lastUpdated"]);
        if (pages && pages.size > 0) {

            const sourcePage = await confluenceConnection.api.content.getContentById(options.parentPageId);

            // Get only the content that is out of date.
            const outOfDateContent = getOutOfDateContent(pages.results, beforeDate);

            // For all the docs that are out of date, let's get the owner information so that we can optionally
            //  send that information to the owner of the doc.
            if (outOfDateContent.length > 0 && options.sendOwnerEmail) {
                await sendOwnerEmails(options, sourcePage, outOfDateContent);
            }

            if (options.sendAdminEmail) {
                await sendAdminEmail(options, sourcePage, outOfDateContent);
            }
            return outOfDateContent;

        } else {
            return [];
        }
    } catch (e) {
        logger("Exception thrown during update: " + e.message);
    }

    return [];
};
