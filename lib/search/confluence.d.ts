import { Content } from "ts-confluence-client/dist/resources/types";
import { ISearchResult, SearchSource } from "./index";
/**
 * Adds the page ID and any page properties to the base search result object.
 */
export interface IConfluenceSearchResult extends ISearchResult {
    pageId: string;
    pageInfo: Content;
}
/**
 * Represents a Confluence search source.  Confluence sources can use either a parent page ID
 * or a space key as the "parent".  You can also use both and you can have multiple of each.
 */
export declare class ConfluenceSource extends SearchSource {
    private spaceKeys;
    private rootPageIds;
    /**
     * Add another space as a documentation source.  All child pages will be
     * searched.
     * @param spaceKey
     */
    addSpace(spaceKey: string): void;
    /**
     * Add another parent page as a documentation source.  It and all of its children
     * will be searched
     * @param pageId - This should be a numeric ID
     */
    addParentPage(pageId: string): void;
    _search(searchString: string): Promise<ISearchResult[]>;
}
