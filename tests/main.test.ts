import {config} from "dotenv";
// @ts-ignore
import express, {Router, Application} from "express";
import {resolve} from "path";
import {DoxStaleCheckJob} from "../src/jobs/staleCheckJob";
import moduleInstance from "../src"
import {DocDiscoveryJob} from "../src/jobs/docDiscoveryJob";
import {ConnectionMap, INexusActiveModule} from "@nexus-switchboard/nexus-extend";
import getConnectionManager from "@nexus-switchboard/nexus-core/dist/lib/connections";
import * as fs from "fs";
import * as path from "path";

const root: string = __dirname;

// @ts-ignore
const result = config({
    path: resolve(root, "data/.env")
});

let app: Application;

beforeAll(() => {
    app = express();
    const nexusConfigStr = fs.readFileSync(path.join(root, "data/.nexus")).toString();
    const nexusConfigOb = JSON.parse(nexusConfigStr);

    getConnectionManager().initialize(nexusConfigOb, app);

    const activeModule: INexusActiveModule = {
        config: undefined,
        router: undefined,
        jobs: [],
        connections: {}
    };

    activeModule.config = moduleInstance.loadConfig({
        SLACK_APP_ID: process.env.SLACK_APP_ID,
        SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
        SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
        SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,

        CONFLUENCE_HOST: process.env.CONFLUENCE_HOST,
        CONFLUENCE_USERNAME: process.env.CONFLUENCE_USERNAME,
        CONFLUENCE_API_KEY: process.env.CONFLUENCE_API_KEY,

        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    });

    activeModule.router = Router();
    const connectionRequests = moduleInstance.loadConnections(activeModule.config, activeModule.router);
    const connectionMap:ConnectionMap = {};
    connectionRequests.forEach((req) => {
        connectionMap[req.name] = getConnectionManager().createConnection(req.name, req.config);
    });
    activeModule.connections = connectionMap;

    moduleInstance.setActiveModuleData(activeModule);

    app.use("/", activeModule.router);
});

test("Validate stale check job", async () => {

    const job = new DoxStaleCheckJob({
        type: "staleness_checker",
        schedule: "",
        options: {
            "PARENT_PAGE_ID": process.env.PARENT_PAGE_ID,
            "STALE_THRESHOLD": process.env.STALE_THRESHOLD,
            "EMAIL_FROM_ADDRESS": process.env.EMAIL_FROM_ADDRESS,
            "EMAIL_SEND_ADMIN": process.env.EMAIL_SEND_ADMIN,
            "EMAIL_SEND_OWNER": process.env.EMAIL_SEND_OWNER,
            "EMAIL_ADMIN_NAME": process.env.EMAIL_ADMIN_NAME,
            "EMAIL_ADMIN_EMAIL": process.env.EMAIL_ADMIN_EMAIL
        }
    });

    await expect(job.run()).resolves.toBeTruthy();

}, 30000);

test("Validate doc discovery job.", async () => {
    const job = new DocDiscoveryJob({
        type: "doc_discovery",
        schedule: "",
        options: {
            "CONFLUENCE_PARENT_PAGE_ID": process.env.CONFLUENCE_PARENT_PAGE_ID,
            "SLACK_POSTING_URL": process.env.SLACK_POSTING_URL,
            "ADMIN_EMAIL": process.env.ADMIN_EMAIL
        }
    });

    await expect(job.run()).resolves.toBeTruthy();
}, 10000);
