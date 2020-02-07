import {Content} from "ts-confluence-client/dist/resources/types";
import moduleInstance, {logger} from "..";
import {getContentProperty, updateContentProperty} from "./helpers";
import {CUSTOM_PROP_NAME, EXPANDED_PROPS, IDocUpdaterProperty, IDoxUser} from "./types";
import {getNestedVal} from "ts-confluence-client/dist/lib";

/**
 * Sets the content owner for the given content by updating the CUSTOM_PROP_NAME custom property on that content.
 * @param content This can be a content ID or a Content object
 * @param owner This can be an account ID or an AtlassianUser object
 */
export const setContentOwner = async (content: string | Content, owner: string | IDoxUser): Promise<IDoxUser> => {

    const conf = moduleInstance.getConfluence();

    let ownerOb: IDoxUser = null;
    if (typeof owner === "string") {
        const atlassianUser = await conf.api.users.getUser(owner);
        ownerOb = {
            userId: atlassianUser.accountId,
            userEmail: atlassianUser.email,
            displayName: atlassianUser.displayName
        };
    } else {
        ownerOb = owner;
    }

    let contentOb: Content = null;
    if (typeof content === "string") {
        contentOb = await conf.api.content.getContentById(content, EXPANDED_PROPS);
    } else {
        contentOb = content;
    }

    const propCreated = await updateContentProperty(contentOb, {
        owner: {
            userId: ownerOb.userId,
            userEmail: ownerOb.userEmail,
            displayName: ownerOb.displayName
        }
    });

    if (propCreated) {
        return propCreated.value.owner;
    } else {
        logger("Unable to create the owner for some reason.  Not much to go on...sorry");
    }
    return undefined;
};

/**
 * Gets the content owner for the given content by using this algorithm:
 *      1. Check that the docupdater prop is set and valid for the given doc.  Return owner from that if it is
 *      2. Check ancestors starting from closest to furthest doing the same thing as #1. Return if owner is found.
 *      3. Take the last updated by value from the given content and use that as the owner.
 * @param content This can be a content ID or a Content object
 */
export const getContentOwner = async (content: string | Content): Promise<IDoxUser> => {

    const conf = moduleInstance.getConfluence();

    const retrieveContent = async (id: string) => {
        return await conf.api.content.getContentById(id, EXPANDED_PROPS);
    };

    // make sure we have the content ob AND its ancestors.
    let contentOb: Content = null;
    if (typeof content === "string") {
        contentOb = await retrieveContent(content);
    } else if (!content.hasOwnProperty("ancestors") ||
        !content.metadata.properties.hasOwnProperty(CUSTOM_PROP_NAME) ||
        !content.hasOwnProperty("history.lastUpdated")) {
        contentOb = await retrieveContent(content.id);
    } else {
        contentOb = content;
    }
    const originalContentOb = contentOb;
    let prop: IDocUpdaterProperty = null;
    while (contentOb) {
        prop = await getContentProperty(contentOb);
        if (prop) {
            break;
        } else {
            // look for next ancestor
            if (contentOb.ancestors.length > 0) {
                const ancestors = contentOb.ancestors;
                const nextId = ancestors.reverse().pop().id;
                contentOb = await retrieveContent(nextId);
            } else {
                // nothing left to use as the owner
                contentOb = null;
            }
        }
    }

    if (!prop) {
        const owner = originalContentOb.history.lastUpdated.by;
        prop = {
            owner: {
                userId: owner.accountId,
                userEmail: owner.email,
                displayName: owner.displayName
            }
        };
    }

    return prop ? getNestedVal(prop, "value.owner") : null;
};
