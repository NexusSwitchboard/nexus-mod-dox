"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configRules = {
    'Confluence Connection': [
        {
            name: 'CONFLUENCE_USERNAME',
            type: ["string"],
            required: true,
            level: "error",
            reason: "Needed to integrate with Confluence APIs"
        },
        {
            name: 'CONFLUENCE_API_KEY',
            required: true,
            level: "error",
            reason: "Needed to integrate with Confluence APIs"
        },
        {
            name: 'CONFLUENCE_HOST',
            type: ["string"],
            required: true,
            level: "error",
            reason: "The base URL for the confluence instance."
        },
    ],
    'Documentation Sources': [
        {
            name: 'DOCUMENTATION_SOURCES',
            type: ["object"],
            required: true,
            level: "error",
            reason: "Needed to indicate what documentation sources to use during searches."
        },
    ],
    'Sendgrid': [
        {
            name: 'SENDGRID_API_KEY',
            type: ['string'],
            required: true,
            level: "error",
            reason: "Sendgrid API key is required to be able to send emails."
        }
    ],
    'Slack Credentials': [
        {
            name: 'SLACK_APP_ID',
            required: true,
            type: ["string"],
            regex: /[A][A-Z0-9]+/,
            level: "error",
            reason: "The app ID is expected to start with an A followed by uppercase alphanumeric characters."
        },
        {
            name: 'SLACK_CLIENT_ID',
            required: true,
            type: ["string"],
            level: "error",
            reason: "The client ID for your slack app is available in the configuration settings for the app."
        },
        {
            name: 'SLACK_CLIENT_SECRET',
            required: true,
            type: ["string"],
            level: "error",
            reason: "The client secret for your slack app is available in the configuration settings for the app."
        },
        {
            name: 'SLACK_SIGNING_SECRET',
            required: true,
            type: ["string"],
            level: "error",
            reason: "The signing secret for your slack app is available in the configuration settings for the app."
        },
        {
            name: 'SLACK_CLIENT_OAUTH_TOKEN',
            required: true,
            type: ["string"],
            regex: /xoxp-[A-Za-z0-9\-]+/,
            level: "error",
            reason: "Used by the bot to represent itself as an app when engaging with the slack client."
        },
        {
            name: 'SLACK_USER_OAUTH_TOKEN',
            required: true,
            type: ["string"],
            regex: /xoxb-[A-Za-z0-9\-]+/,
            level: "error",
            reason: "Used by the bot to represent itself as a user when engaging with the slack client."
        },
    ],
    'Github': [
        {
            name: 'GITHUB_API_TOKEN',
            required: true,
            type: ["string"],
            level: "error",
            reason: "The API token generated for this use module specific use."
        },
        {
            name: 'GITHUB_BASE_URL',
            required: true,
            type: ["string"],
            level: "error",
            reason: "The url to the github instance's API (usually ."
        }
    ]
};
exports.default = configRules;
//# sourceMappingURL=config.js.map