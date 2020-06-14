import {Content, SearchResult} from "ts-confluence-client/dist/resources/types";
import moduleInstance, {logger} from "../../..";
import {ISearchResult, SearchSource} from "./index";

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
export class ConfluenceSource extends SearchSource {
    private spaceKeys: string[] = [];
    private rootPageIds: string[] = [];

    /**
     * Add another space as a documentation source.  All child pages will be
     * searched.
     * @param spaceKey
     */
    public addSpace(spaceKey: string) {
        this.spaceKeys.push(spaceKey);
    }

    /**
     * Add another parent page as a documentation source.  It and all of its children
     * will be searched
     * @param pageId - This should be a numeric ID
     */
    public addParentPage(pageId: string) {
        this.rootPageIds.push(pageId);
    }

    public async _search(searchString: string): Promise<ISearchResult[]> {
        const selectors = [];

        if (this.spaceKeys.length) {
            selectors.push(`(space in ("${this.spaceKeys.join("\",\"")}"))`);
        }

        if (this.rootPageIds.length) {
            selectors.push(`(ancestor in ("${this.rootPageIds.join("\",\"")}"))`);
        }

        const selectorQuery = selectors.join(" OR ");

        const queryFinal = `(${selectorQuery}) AND (text ~ "${searchString}" OR title ~ "${searchString}")`;

        const conf = moduleInstance.getConfluence();

        try {
            const results = await conf.api.search.search(queryFinal);
            return results.map((result: SearchResult) => {
                return {
                    type: "confluence",
                    name: result.title,
                    excerpt: result.excerpt,
                    pageId: result.content.id,
                    pageInfo: result.content
                };
            });
        }
        catch (e) {
            logger("Documentation search failed: " + e.message);
            return [];
        }
    }
}
