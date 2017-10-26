# Sous-Chef

## What is Sous Chef?

Sous Chef Restaurant Assistant is an app that eliminates the need for paper receipts or orders in the kitchen.

It consists of a web UI programmed using both Javascript and HTML and an Alexa app programmed in Node.JS.

Sous Chef uses voice commands to Alexa to manipulate orders that are displayed on a separate screen.

## Why use Sous Chef?

The benfits of using voice commands instead of paper:

1. Can't lose an order by misplacing it when the order is displayed electronically

2. Paper is an unecessary contaminant in the kitchen

3. Electronic orders can be combined, separated, or otherwise manipulated much more easily

4. No need to refill on ink or paper ever again

## How does Sous Chef work?

An Amazon Dynamo database contains each order as a separate item in a table.

Currently, orders must be manually added to the database directly or through `menu.html`, but the code can be easily modified to accommodate a POS system in a real restaurant setting.

Voice commands given to Alexa will be translated and categorized into "Intents," which are then passed to Sous Chef, which calls the appropriate function and performs the given manipulation on the data. 

For example, if the user says "start order 8" or just "start 8", Alexa will interpret the command as a `START_ORDERIntent` with the parameter `8`. Then Sous Chef will call the function `startOrder()` with the argument `8`, and mark order 8 in the database as started.

The Web UI displays the current state of the database in a well-organized and aesthetically-pleasing manner, and continuously updates its display as the database changes.

Users can also manipulate the orders via the Web UI by clicking on one of the buttons marked on the display.

## Instructions:

### WEB UI

Run `index.html` to see the web UI.

Run `menu.html` to add items to a database to manipulate them with Alexa.

### ALEXA UI

`Final.js` contains our code for the Lambda function that controls behavior.

The rest of the files deal with an Alexa Skills Kit.

`IntentSchema.json` is to be copied into the Intent Schema portion of the Alexa Skills Kit.

`SampleUtterances.txt` is to be copied into the Sample Utterances portion.

`slot1.txt` is to be copied into the Slot portion.


### Sample Alexa Commands

* "start/complete/delete order X"
* "help"
* "queue summary"
  * Queue summary will group all items of the same name together across orders to give a count of how many of each item are not yet complete 
* "undo"
