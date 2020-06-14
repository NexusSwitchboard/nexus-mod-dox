/**
 * Base interface for all search result types.  All search results must include the name of the
 * resulting page and an excerpt if available.
 */
export interface ISearchResult {
    type: SearchSourceType;
    name: string;
    excerpt: string;
}

export type SearchSourceType = "confluence" | "github";

/**
 * Base class for all search sources. Sources are used when doing documentation searches and expose
 * a single overridable method called _search.  It is the responsibility of the derived classes to manage all
 * the configuration and initialization values.
 */
export abstract class SearchSource {
    public async search(searchString: string): Promise<ISearchResult[]> {
        // TODO: Store search history

        return this._search(searchString);
    }

    protected abstract async _search(searchString: string): Promise<ISearchResult[]>;
}


/**
 * Searches all the given sources for the given search string.
 * @param searchString
 * @param sources
 */
export const searchEverything = async (searchString: string, sources: SearchSource[]) => {
    return sources.reduce(async (prev: Promise<ISearchResult[]>, source: SearchSource) => {
        const prevArray = await prev;
        const searchResults = await source.search(searchString);
        return prevArray.concat(searchResults);
    }, Promise.resolve([]));
};


