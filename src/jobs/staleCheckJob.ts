import {Job} from "@nexus-switchboard/nexus-extend";
import {checkPagesForOutOfDateContent} from "../lib";

export interface IStaleCheckDetails {
    parentPageId: string;
    staleDocumentAfterInDays: number;
    sendFrom: string;
    sendAdminEmail: boolean;
    sendOwnerEmail: boolean;
    adminInfo: {
        name: string,
        email: string
    };
}

export class DoxStaleCheckJob extends Job {

    public name = "staleness_checker";
    protected requiredOptions = ["PARENT_PAGE_ID", "STALE_THRESHOLD", "EMAIL_FROM_ADDRESS", "EMAIL_SEND_ADMIN",
        "EMAIL_SEND_OWNER", "EMAIL_ADMIN_NAME", "EMAIL_ADMIN_EMAIL"];

    protected async _run(): Promise<boolean> {
        try {
            const check: IStaleCheckDetails = {
                parentPageId: this.definition.options.PARENT_PAGE_ID,
                staleDocumentAfterInDays: this.definition.options.STALE_THRESHOLD,
                sendFrom: this.definition.options.EMAIL_FROM_ADDRESS,
                sendAdminEmail: this.definition.options.EMAIL_SEND_ADMIN,
                sendOwnerEmail: this.definition.options.EMAIL_SEND_OWNER,
                adminInfo: {
                    name: this.definition.options.EMAIL_ADMIN_NAME,
                    email: this.definition.options.EMAIL_ADMIN_EMAIL
                },
            };

            await checkPagesForOutOfDateContent(check);
            return true;
        } catch (e) {
            return false;
        }
    }
}
