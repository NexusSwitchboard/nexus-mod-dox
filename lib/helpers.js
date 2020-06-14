"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const nexus_extend_1 = require("@nexus-switchboard/nexus-extend");
const __1 = tslib_1.__importStar(require(".."));
const types_1 = require("./types");
/**
 * This will update the wiki page custom property given for the  "dox" module
 * @param content
 * @param props
 */
function updateContentProperty(content, props) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const conf = __1.default.getConfluence();
        try {
            return yield conf.api.content.upsertContentProperty(content, types_1.CUSTOM_PROP_NAME, props, true);
        }
        catch (e) {
            __1.logger("Unable to upsert the content property because: " + e.message);
            return null;
        }
    });
}
exports.updateContentProperty = updateContentProperty;
/**
 * Validation is necessary in cases where the value is not set during compile-time but is retrieved
 * from external storage (like Confluence itself).
 * @param prop THe property to validate.
 */
function validateDoxProp(prop) {
    return (prop && prop.hasOwnProperty("owner") && validateOwnerData(prop.owner));
}
exports.validateDoxProp = validateDoxProp;
/**
 * Ensures that the given object matches the type def of IDoxUser at runtime.
 * @param owner
 */
function validateOwnerData(owner) {
    return owner && nexus_extend_1.getNestedVal(owner, "userId") &&
        nexus_extend_1.getNestedVal(owner, "userEmail") &&
        nexus_extend_1.getNestedVal(owner, "displayName");
}
exports.validateOwnerData = validateOwnerData;
/**
 * This will retrieve the custom property validating that the value retrieved is valid.  Returns null if not there
 * or invalid.
 * @param content
 */
function getContentProperty(content) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const conf = __1.default.getConfluence();
        let output;
        try {
            let contentOb = null;
            if (typeof content === "string") {
                contentOb = yield conf.api.content.getContentById(content, types_1.EXPANDED_PROPS);
            }
            else {
                contentOb = content;
            }
            if (nexus_extend_1.getNestedVal(contentOb, `metadata.properties.${types_1.CUSTOM_PROP_NAME}`)) {
                // in this case, the content has had the prop set AND it is has been expanded in the given content.
                //  Now we just need to check that the value is valid.
                const temp = contentOb.metadata.properties[types_1.CUSTOM_PROP_NAME] || {};
                if (temp && validateDoxProp(temp.value)) {
                    output = temp;
                }
                else {
                    // The property is there but not correct so return null;
                    output = null;
                }
            }
            else if (nexus_extend_1.getNestedVal(contentOb, `metadata.properties._expandable.${types_1.CUSTOM_PROP_NAME}`)) {
                // in this case, the content had had the whatprop set BUT it has not been expanded so we will call
                //  a specific content api to retrieve just that property.
                const temp = yield conf.api.content.getContentProperty(contentOb.id, types_1.CUSTOM_PROP_NAME);
                if (temp && validateDoxProp(temp.value)) {
                    output = temp.value;
                }
                else {
                    output = null;
                }
            }
            else {
                // in this case, the value has never been set so we can return null here
                output = null;
            }
        }
        catch (e) {
            __1.logger("Unable to upsert the content property because: " + e.message);
        }
        return output;
    });
}
exports.getContentProperty = getContentProperty;
//# sourceMappingURL=helpers.js.map