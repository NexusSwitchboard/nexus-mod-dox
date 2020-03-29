import {SlackConnection, ISlackAckResponse, SlackEventList, SlackPayload} from "@nexus-switchboard/nexus-conn-slack";

/**
 * General handler for thread posts made in threads that are part of an open request.
 * @param _conn
 * @param _slackParams The params past to the event handler
 */
const handlePostedThreadMessage = async (_conn: SlackConnection,
                                         _slackParams: SlackPayload): Promise<ISlackAckResponse> => {

    // TODO : Do stuff here.

    return {
        code: 200
    };

};

export const events: SlackEventList = {
    message: async (conn: SlackConnection, slackParams: SlackPayload): Promise<ISlackAckResponse> => {
        return handlePostedThreadMessage(conn, slackParams);
    }
};
