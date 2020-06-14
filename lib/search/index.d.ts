/**
 * Base interface for all search result types.  All search results must include the name of the
 * resulting page and an excerpt if available.
 */
export interface ISearchResult {
    type: SearchSourceType;
    name: string;
    excerpt: string;
}
export declare type SearchSourceType = "confluence" | "github";
/**
 * Base class for all search sources. Sources are used when doing documentation searches and expose
 * a single overridable method called _search.  It is the responsibility of the derived classes to manage all
 * the configuration and initialization values.
 */
export declare abstract class SearchSource {
    search(searchString: string): Promise<ISearchResult[]>;
    protected abstract _search(searchString: string): Promise<ISearchResult[]>;
}
/**
 * Searches all the given sources for the given search string.
 * @param searchString
 * @param sources
 */
export declare const searchEverything: (searchString: string, sources: SearchSource[]) => Promise<any[]>;
/**
 * The default search takes the configured parent documents/folders and searches those along with all their
 * children (if applicable).
 * @param query The search term
 */
export declare const doDefaultSearch: (query: string) => Promise<Record<string, any>>;
