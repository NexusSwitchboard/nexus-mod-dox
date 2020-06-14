import {getNestedVal} from "@nexus-switchboard/nexus-extend";
import {Content, ContentProperty} from "ts-confluence-client/dist/resources/types";
import moduleInstance, {logger} from "..";
import {CUSTOM_PROP_NAME, EXPANDED_PROPS, IDocUpdaterProperty} from "./types";

/**
 * This will update the wiki page custom property given for the  "dox" module
 * @param content
 * @param props
 */
export async function updateContentProperty(content: Content,
                                            props: IDocUpdaterProperty): Promise<ContentProperty> {

    const conf = moduleInstance.getConfluence();

    try {
        return await conf.api.content.upsertContentProperty(content, CUSTOM_PROP_NAME, props, true);
    } catch (e) {
        logger("Unable to upsert the content property because: " + e.message);
        return null;
    }
}

/**
 * This will retrieve the custom property validating that the value retrieved is valid.  Returns null if not there
 * or invalid.
 * @param content
 */
export async function getContentProperty(content: string | Content): Promise<IDocUpdaterProperty> {

    const conf = moduleInstance.getConfluence();

    let output: IDocUpdaterProperty;
    try {
        let contentOb: Content = null;
        if (typeof content === "string") {
            contentOb = await conf.api.content.getContentById(content, EXPANDED_PROPS);
        } else {
            contentOb = content;
        }
        if (getNestedVal(contentOb, `metadata.properties.${CUSTOM_PROP_NAME}`)) {
            // in this case, the content has had the prop set AND it is has been expanded in the given content.
            //  Now we just need to check that the value is valid.
            const temp = contentOb.metadata.properties[CUSTOM_PROP_NAME] || {};
            if (temp && validateDoxProp(temp.value)) {
                output = temp;
            } else {
                // The property is there but not correct so return null;
                output = null;
            }
        } else if (getNestedVal(contentOb, `metadata.properties._expandable.${CUSTOM_PROP_NAME}`)) {
            // in this case, the content had had the whatprop set BUT it has not been expanded so we will call
            //  a specific content api to retrieve just that property.
            const temp = await conf.api.content.getContentProperty(contentOb.id, CUSTOM_PROP_NAME);
            if (temp && validateDoxProp(temp.value)) {
                output = temp.value;
            } else {
                output = null;
            }
        } else {
            // in this case, the value has never been set so we can return null here
            output = null;
        }
    } catch (e) {
        logger("Unable to upsert the content property because: " + e.message);
    }
    return output;
}
