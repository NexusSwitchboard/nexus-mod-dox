import {Content} from "ts-confluence-client/dist/resources/types";

export const CUSTOM_PROP_NAME = "dox";
export const EXPANDED_PROPS = ["history.lastUpdated", "ancestors", "metadata.properties." + CUSTOM_PROP_NAME];

export interface IDoxUser {
    userId: string;
    userEmail: string;
    displayName: string;
}

export interface IDocUpdaterProperty {
    owner: IDoxUser;
}

export interface IContentAndOwner {
    owner: IDoxUser;
    content: Content[];
}
