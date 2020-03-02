import {Content} from "ts-confluence-client/dist/resources/types";
import moduleInstance, {logger} from "..";
import {IStaleCheckDetails} from "../jobs/staleCheckJob";
import {updateContentProperty} from "./helpers";
import {getContentOwner} from "./owners";
import {IContentAndOwner, IDoxUser} from "./types";

/**
 * Given a list of out of date docs, this will group them by owner then send a single email per owner containing
 * all the docs that are owned by that person and are out of date.
 * @param sourcePage
 * @param outOfDateContent
 * @param options
 */
export async function sendOwnerEmails(options: IStaleCheckDetails,
                                      sourcePage: Content,
                                      outOfDateContent: Content[]) {

    const emailConn = moduleInstance.getSendgrid();
    const config = moduleInstance.getActiveModuleConfig();

    const docsGroupedByOwner: Record<string, IContentAndOwner> = {};

    for (const page of outOfDateContent) {
        let owner: IDoxUser = await getContentOwner(page);

        if (!owner) {
            owner = {
                userId: "__admin__",
                userEmail: config.EMAIL_ADMIN_EMAIL,
                displayName: config.EMAIL_ADMIN_NAME
            }
        }

        const inputProp = {
            owner
        };

        const resultProp = await updateContentProperty(page, inputProp);
        if (resultProp) {
            if (!docsGroupedByOwner.hasOwnProperty(inputProp.owner.userId)) {
                docsGroupedByOwner[inputProp.owner.userId] = {
                    owner: inputProp.owner,
                    content: []
                };
            }
            docsGroupedByOwner[inputProp.owner.userId].content.push(page);
        }
    }

    for (const key of Object.keys(docsGroupedByOwner)) {

        // sends a single email for all docs that are out of date for each user.
        const owner = docsGroupedByOwner[key].owner;
        const content = docsGroupedByOwner[key].content;

        if (owner.userEmail) {
            await emailConn.send({
                from: options.sendFrom,
                to: owner.userEmail,
                subject: `[Doc Updater] Summary of stale docs for parent "${sourcePage.title}"`,
                text: content.map((page) => {
                    return `${page.title} (${page.id}) by ${page.history.lastUpdated.by.displayName}` +
                        `${config.CONFLUENCE_HOST}${page._links.tinyui}`;

                }).join("\n")
            });
        } else {
            logger(`The documents for  "${owner.displayName}" cannot be sent because we couldn't access their email`);
        }
    }
}

/**
 * Sends an email to the admin for the given set of out of date content.
 * @param options
 * @param sourcePage
 * @param outOfDateContent
 */
export async function sendAdminEmail(options: IStaleCheckDetails,
                                     sourcePage: Content,
                                     outOfDateContent: Content[]) {

    const emailConn = moduleInstance.getSendgrid();
    const config = moduleInstance.getActiveModuleConfig();

    // Build  email string
    let emailBody = "";
    if (outOfDateContent && outOfDateContent.length > 0) {
        emailBody = outOfDateContent.map((page: Content) => {
            return `${page.title} (${page.id}) by ${page.history.lastUpdated.by.displayName}\n` +
                `${config.CONFLUENCE_HOST}${page._links.tinyui}`;
        }).join("\n");
    } else {
        emailBody = "No out of date documents were found.";
    }
    // Sends an email of all out  of date docs across all users.
    await emailConn.send({
        from: options.sendFrom,
        to: options.adminInfo,
        subject: `[Doc Updater] Summary of Out of Date Docs for "${sourcePage.title}"`,
        text: emailBody
    });
}
