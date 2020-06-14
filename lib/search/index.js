"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * Base class for all search sources. Sources are used when doing documentation searches and expose
 * a single overridable method called _search.  It is the responsibility of the derived classes to manage all
 * the configuration and initialization values.
 */
class SearchSource {
    search(searchString) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // TODO: Store search history
            return this._search(searchString);
        });
    }
}
exports.SearchSource = SearchSource;
/**
 * Searches all the given sources for the given search string.
 * @param searchString
 * @param sources
 */
exports.searchEverything = (searchString, sources) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    return sources.reduce((prev, source) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const prevArray = yield prev;
        const searchResults = yield source.search(searchString);
        return prevArray.concat(searchResults);
    }), Promise.resolve([]));
});
/**
 * The default search takes the configured parent documents/folders and searches those along with all their
 * children (if applicable).
 * @param query The search term
 */
exports.doDefaultSearch = (query) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const source = new ConfluenceSource();
    source.addParentPage("791220290");
    source.addParentPage("775127602");
    const results = yield exports.searchEverything(query, [source]);
    return { results };
});
//# sourceMappingURL=index.js.map