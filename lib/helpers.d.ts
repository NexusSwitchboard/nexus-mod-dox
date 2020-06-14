import { Content, ContentProperty } from "ts-confluence-client/dist/resources/types";
import { IDocUpdaterProperty, IDoxUser } from "./types";
/**
 * This will update the wiki page custom property given for the  "dox" module
 * @param content
 * @param props
 */
export declare function updateContentProperty(content: Content, props: IDocUpdaterProperty): Promise<ContentProperty>;
/**
 * Validation is necessary in cases where the value is not set during compile-time but is retrieved
 * from external storage (like Confluence itself).
 * @param prop THe property to validate.
 */
export declare function validateDoxProp(prop: IDocUpdaterProperty): any;
/**
 * Ensures that the given object matches the type def of IDoxUser at runtime.
 * @param owner
 */
export declare function validateOwnerData(owner: IDoxUser): any;
/**
 * This will retrieve the custom property validating that the value retrieved is valid.  Returns null if not there
 * or invalid.
 * @param content
 */
export declare function getContentProperty(content: string | Content): Promise<IDocUpdaterProperty>;
