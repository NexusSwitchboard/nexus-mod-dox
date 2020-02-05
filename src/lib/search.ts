import {Content, SearchResult} from "ts-confluence-client/dist/resources/types";
import moduleInstance from "..";

export enum SearchSourceType {
    confluence = "confluence"
}

export interface ISearchResult {
    type: SearchSourceType;
    name: string;
    excerpt: string;
}

export interface IConfluenceSearchResult extends ISearchResult {
    pageId: string;
    pageInfo: Content;
}

abstract class SearchSource {
    public async search(searchString: string): Promise<ISearchResult[]> {
        // TODO: Store search history

        return this._search(searchString);
    }

    protected abstract async _search(searchString: string): Promise<ISearchResult[]>;
}

// tslint:disable-next-line:max-classes-per-file
export class ConfluenceSource extends SearchSource {
    private spaceKeys: string[] = [];
    private rootPageIds: string[] = [];

    public addSpace(spaceKey: string) {
        this.spaceKeys.push(spaceKey);
    }

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

        const results = await conf.api.search.search(queryFinal);
        return results.map((result: SearchResult) => {
            return {
                type: SearchSourceType.confluence,
                name: result.title,
                excerpt: result.excerpt,
                pageId: result.content.id,
                pageInfo: result.content
            };
        });
    }
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

export const doDefaultSearch = async (query: string): Promise<Record<string, any>> => {
    const source = new ConfluenceSource();
    source.addParentPage("791220290");
    source.addParentPage("775127602");
    const results = await searchEverything(query, [source]);
    return {results};
};
