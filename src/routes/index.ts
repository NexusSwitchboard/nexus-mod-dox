import {Request, Response} from "express";
import {IRouteDefinition} from "@nexus-switchboard/nexus-extend";
import {DocDiscoveryJob} from "../jobs/docDiscoveryJob";
import {checkPagesForOutOfDateContent} from "../lib";
import {validateOwnerData} from "../lib/helpers";
import {getContentOwner, setContentOwner} from "../lib/owners";
import {doDefaultSearch} from "../lib/search";

const routes: IRouteDefinition[] = [
    {
        method: "get",
        path: "/stale/:parentPageId",
        protected: false,
        handler: async (req: Request, res: Response): Promise<any> => {
            const results = await checkPagesForOutOfDateContent({
                parentPageId: req.params.parentPageId,
                staleDocumentAfterInDays: req.query.staleAfter || 60,
                sendAdminEmail: true,
                sendOwnerEmail: false,
                sendFrom: "kshehadeh@underarmour.com",
                adminInfo: {
                    name: "Karim Shehadeh",
                    email: "kshehadeh@underarmour.com"
                }
            });

            if (results) {
                return res.json(results).status(200);
            }

            return res.json({message: "Failed to retrieve docs that need updating"}).status(500);
        }
    },
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
        path: "/owner/:pageId",
        handler: async (req: Request, res: Response) => {
            const owner = await getContentOwner(req.params.pageId);
            if (owner) {
                return res.json(owner).status(200);
            }
            return res.json({message: "Failed to retrieve the owner for that document"}).status(404);
        }
    },
    {
        method: "post",
        protected: false,
        path: "/owner/:pageId",
        handler: async (req: Request, res: Response) => {
            if (!validateOwnerData(req.body)) {
                return res.json({message: "The owner data given does not match expected object"}).status(400);
            }

            const owner = await setContentOwner(req.params.pageId, req.body);
            if (owner) {
                return res.json(owner).status(200);
            }
            return res.json({message: "Failed to retrieve the owner for that document"}).status(404);
        }
    },
    {
        method: "get",
        protected: false,
        path: "/search",
        handler: async (req: Request, res: Response) => {
            return res.json(doDefaultSearch(req.query.q));
        }
    }
];

export default routes;
