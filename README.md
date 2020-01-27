# Dox
---
Dox is a general purpose documentation helper which connects 
tools with your documentation provider to allow for easier discovery 
of documentation among other things.

# Staleness Checker
Module which takes a parent page in Confluence and monitors the child pages
looking for documents that are over a certain staleness threshold (hasn't been updated).

Once that period elaspes, you have the option to send an email 
containing a list of all the stale pages to the owners or 
the admin for that set of pages.    

## Routes

### /m/docupdater/:parentPageId

*URI Params*
* `parentPageId` - The ID of the parent page to look at stale children.

*Query Params*
* `staleAfter` -  The number of days since updating after which a doc is considered to be stale.

This currently defaults to only sending to the administrator which is hardcoded as Karim Shehadeh for now

TODO: Update to allow an admin email to be specified in the URL.

*Response*

    [{
        "id": "777685685",
        "type": "",
        "status": "",
        "title": "",
        "history": {
            ...
        },
        "extensions": {
            ...
        },
        "_expandable": {
            ...
        },
        "_links": {
            ...
        },
        "score": -7
    },...]    

# Doc Discovery
Discovery is both a Confluence and slack integration that semi-randomly selects
a child page of a given page and returns it's metadata.  It will also update
certain custom properties on the page to help it decide what to select the next time 
the same request is made.

## Custom Properties
This module takes advantage of the custom property feature in Confluence.  Using the REST API
we create a custom property called `discovery` which holds the following data:

    {
        lastAccessed: string,  // iso formatted
        useCount: number
    };

if a document does not have this property, it is automatically set when first accessed.  It will
treat the document as if it has never been accessed.

## Selection Process

1. Filter out any documents that have been updated in the last X days (currently 7).
2. Score the remaining documents based on how often they've been selected, when they were 
    last selected and when they were last udpated.
3. Sort the list so that heigher rated items come first.
4. Take the top X docs and randomly select one of them.

## Jobs
*Slack Post of Random _Did You Know_*
Every `SLACK_POSTING_CRON` (see `config/index.ts` to change the configuration), a semi-random DYK will
be selected from the main Did You Know page children and  will be posted on the #eng-did-you-know  slack 
channel.

## Configuration

* SLACK_POSTING_CRON - Change how often this job is run
* SLACK_POSTING_URL - You  can setup the Slack  App with a new incoming webhook.  When you  do,  you will have
    to change this to make  sure it posts there.
* SLACK_PARENT_PAGE_ID - This is the Confluence page ID to use as the parent from which children will be selected.


## Routes

### `/m/discovery/:parentPageId`

*URI Params*
* `parentPageId` - The confluence ID for the parent page under which a 
                child page should be returned

*Query Params*
* `slack` -  Set this to a non-empty value  to  have  it  post to the configured slack webhook

*Response*

    {
        "id": "777685685",
        "type": "",
        "status": "",
        "title": "",
        "history": {
            ...
        },
        "extensions": {
            ...
        },
        "_expandable": {
            ...
        },
        "_links": {
            ...
        },
        "score": -7
    }    
