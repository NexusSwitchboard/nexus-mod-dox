import {Request, Response} from "express";
import {IRouteDefinition} from "@nexus-switchboard/nexus-extend";
import {DocDiscoveryJob} from "../jobs/docDiscoveryJob";
import {doDefaultSearch} from "../lib/search";

const routes: IRouteDefinition[] = [
    {
        method: "get",
        protected: false,
        path: "/discovery/:parentPageId/clean",
        handler: async (req: Request, res: Response) => {
            const pagesCleaned = await DocDiscoveryJob.cleanChildPages(req.params.parentPageId);
            return res.json({
                success: pagesCleaned,
            }).status(200);
        }
    },
    {
        method: "get",
        protected: false,
        path: "/search",
        handler: async (req: Request, res: Response) => {
            return res.json(doDefaultSearch(req.query.q as string));
        }
    }
];

export default routes;
