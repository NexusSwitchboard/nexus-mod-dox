"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * General handler for thread posts made in threads that are part of an open request.
 * @param _conn
 * @param _slackParams The params past to the event handler
 */
const handlePostedThreadMessage = (_conn, _slackParams) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    // TODO : Do stuff here.
    return {
        code: 200
    };
});
exports.events = {
    message: (conn, slackParams) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        return handlePostedThreadMessage(conn, slackParams);
    })
};
//# sourceMappingURL=events.js.map