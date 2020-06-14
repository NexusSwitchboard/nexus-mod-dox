import { ConfluenceConnection } from "@nexus-switchboard/nexus-conn-confluence";
import { EmailAddress } from "@nexus-switchboard/nexus-conn-sendgrid";
import { Job } from "@nexus-switchboard/nexus-extend";
import { Content } from "ts-confluence-client/dist/resources/types";
declare type WeightedContent = Content & {
    score: number;
};
export declare class DocDiscoveryJob extends Job {
    /**
     * Clears the children of the given page of all "didjaknow" property data.  This can be used
     * in cases where you want to reset the timers so that all articles get pretty much the same
     * opportunity to be selected.
     * @param pageId The ID of the page whose children should be cleared of didjaknow data
     */
    static cleanChildPages(pageId: string): Promise<boolean>;
    name: string;
    protected requiredOptions: string[];
    /**
     * This will use a weighted sysmtem for selecting a child page and optionally notify a slack channel if a channel
     * is given.
     * @param parentPageId The ID of the parent page.
     * @param slackChannel The slack channel (Optional)
     * @param adminEmail
     */
    selectChildPage(parentPageId: string, slackChannel?: string, adminEmail?: EmailAddress): Promise<Record<string, any>>;
    protected _run(): Promise<boolean>;
    /**
     * Takes an array of page objects, filters out the  pages  that were updated recently then  scores the remaining
     * docs.  The higher the score, the more relevant the story taking into account when it was last updated,
     * how frequently it has been chosen and when it was last chosen.  It then sorts the list in descending order
     * and takes the top X stories and randomly selects one then updates the properties to reflect the new selection.
     * @param arr
     */
    protected filterWeightAndSort(arr: Content[]): WeightedContent[];
    /**
     * Given a api connection and a parent page ID, select a page based on criteria including
     * when a page was last picked, when it was last updated, and how often it has been picked.
     * @param confluence The api connection
     * @param parentPageId The ID of the api page to look for child pages in.
     */
    protected getRandomPage(confluence: ConfluenceConnection, parentPageId: string): Promise<WeightedContent>;
    protected sendToSlack(slackChannel: string, pageDetails: Content): Promise<void>;
}
export {};
