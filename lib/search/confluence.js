"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const __1 = tslib_1.__importStar(require("../../.."));
const index_1 = require("./index");
/**
 * Represents a Confluence search source.  Confluence sources can use either a parent page ID
 * or a space key as the "parent".  You can also use both and you can have multiple of each.
 */
class ConfluenceSource extends index_1.SearchSource {
    constructor() {
        super(...arguments);
        this.spaceKeys = [];
        this.rootPageIds = [];
    }
    /**
     * Add another space as a documentation source.  All child pages will be
     * searched.
     * @param spaceKey
     */
    addSpace(spaceKey) {
        this.spaceKeys.push(spaceKey);
    }
    /**
     * Add another parent page as a documentation source.  It and all of its children
     * will be searched
     * @param pageId - This should be a numeric ID
     */
    addParentPage(pageId) {
        this.rootPageIds.push(pageId);
    }
    _search(searchString) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const selectors = [];
            if (this.spaceKeys.length) {
                selectors.push(`(space in ("${this.spaceKeys.join("\",\"")}"))`);
            }
            if (this.rootPageIds.length) {
                selectors.push(`(ancestor in ("${this.rootPageIds.join("\",\"")}"))`);
            }
            const selectorQuery = selectors.join(" OR ");
            const queryFinal = `(${selectorQuery}) AND (text ~ "${searchString}" OR title ~ "${searchString}")`;
            const conf = __1.default.getConfluence();
            try {
                const results = yield conf.api.search.search(queryFinal);
                return results.map((result) => {
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
                __1.logger("Documentation search failed: " + e.message);
                return [];
            }
        });
    }
}
exports.ConfluenceSource = ConfluenceSource;
//# sourceMappingURL=confluence.js.map