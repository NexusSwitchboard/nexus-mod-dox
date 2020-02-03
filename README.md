# Dox - Nexus Module

Dox is a general purpose documentation helper which connects 
tools with your documentation provider to allow for easier discovery 
of documentation among other things.

This module is an extension to the [Nexus Switchboard framework](https://github.com/NexusSwitchboard/nexus-core).  It cannot be run on its own.


## Configuration
The Dox module has the following configuration options:

**Slack Configuration**

For these values, visit [the Slack API documentation center](https://api.slack.com)

* *SLACK_APP_ID*
* *SLACK_CLIENT_ID*
* *SLACK_CLIENT_SECRET*
* *SLACK_SIGNING_SECRET*

**Confluence Configuration**

* *CONFLUENCE_HOST* - This should be the absolute URI to the root of your confluence instance.
* *CONFLUENCE_USERNAME*
* *CONFLUENCE_API_KEY* - Do not use your password here - create a new API token for the given user.

**Sendgrid Configuration**

*SENDGRID_API_KEY*

# Jobs

## Doc Age Check
Module which takes a parent page in Confluence and monitors the child pages
looking for documents that are over a certain age threshold (hasn't been updated).

Once that period elaspes, you have the option to send an email 
containing a list of all the stale pages to the owners or 
the admin for that set of pages.    

### Configuration
* PARENT_PAGE_ID - The ID of the confluence page
* STALE_THRESHOLD - The age, in days, after which a doc is considered "stale"
* EMAIL_FROM_ADDRESS - When sending email, the from address
* EMAIL_SEND_ADMIN - Set to true, to send an email to the admin after each job run with information about the results.
* EMAIL_SEND_OWNER - Send an email to a document's owner if it has become stale.
* EMAIL_ADMIN_NAME - The name to use when sending admin an email
* EMAIL_ADMIN_EMAIL - The email to use as the admin's email.


## Doc Discovery
Discovery is both a Confluence and slack integration that semi-randomly selects a child page of a given page and returns it's metadata.  It will also update certain custom properties on the page to help it decide what to select the next time the same request is made.

### Configuration
* PARENT_PAGE_ID - The ID of the parent page in Confluence to use for selecting child pages. 
* SLACK_POSTING_URL - The URL to use for posting to a specific channel in slack.  This would be setup as part of your Slack App.
* ADMIN_EMAIL - The email to use for notifying the admin that a new doc has been posted.

# Custom Properties
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
