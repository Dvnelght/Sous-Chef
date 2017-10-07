'use strict';

console.log('Loading function');

const doc = require('dynamodb-doc');

const dynamo = new doc.DynamoDB();


// SJ CODE START

var fetchData;
var fetching = true;

// SJ CODE END


/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 *
 * To scan a DynamoDB table, make a GET request with the TableName as a
 * query string parameter. To put, update, or delete an item, make a POST,
 * PUT, or DELETE request respectively, passing in the payload to the
 * DynamoDB API as a JSON body.
 */
exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json', 'Access-Control-Allow-Headers': 'x-requested-with',
            "Access-Control-Allow-Origin" : "*", "Access-Control-Allow-Credentials" : true,
        },
    });

    if (event.httpMethod) {
        switch (event.httpMethod) {
            case 'DELETE':
                dynamo.deleteItem(JSON.parse(event.body), done);
                break;
            case 'GET':
                dynamo.scan({ TableName: event.queryStringParameters.TableName }, done);
                break;
            case 'POST':
                dynamo.putItem(JSON.parse(event.body), done);
                break;
            case 'PUT':
                dynamo.updateItem(JSON.parse(event.body), done);
                break;
            default:
                done(new Error(`Unsupported method "${event.httpMethod}"`));
        }
    } else {
        try {
            console.log("event.session.application.applicationId=" + event.session.application.applicationId);

            /**
             * Uncomment this if statement and populate with your skill's application ID to
             * prevent someone else from configuring a skill that sends requests to this function.
             */

            /**if (event.session.application.applicationId !== "amzn1.ask.skill.b24af024-2068-4fd8-8dfe-6cfa236d0bad") {
                context.fail("Invalid Application ID");
            }**/

            if (event.session.new) {
                onSessionStarted({requestId: event.request.requestId}, event.session);
            }



            if (event.request.type === "LaunchRequest") {
                onLaunch(event.request,
                    event.session,
                    function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                    });
            } else if (event.request.type === "IntentRequest") {

                onIntent(event.request,
                    event.session,
                    function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                    });
            } else if (event.request.type === "SessionEndedRequest") {
                console.log("Made it to ending session");
                onSessionEnded(event.request, event.session);
                context.succeed();
            }
        } catch (e) {
            context.fail("Exception: " + e);
        }
    }

};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    //just calls the startup message
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;


    if (session.attributes && session.attributes.state) {
        if (session.attributes.state === "deleteConfirm" ) {
            if ("AMAZON.YesIntent" === intentName) {
                deleteFinal(intent, session, callback);
            } else  {
                returnToMain(intent, session, callback);
            }
        } else if (session.attributes.state === "completeConfirm") {
            if ("AMAZON.YesIntent" === intentName) {
                completeFinal(intent, session, callback);
            } else  {
                returnToMain(intent, session, callback);
            }
        } else if (session.attributes.state === "quitConfirm") {
            if ("AMAZON.YesIntent" === intentName) {
                quitFinal(intent, session, callback);
            } else  {
                returnToMain(intent, session, callback);
            }
        } else {
            //if the state is something we don't recognize, start over
            getWelcomeResponse(callback);
        }
    } else {
        if ("StartOrderIntent" === intentName) {
            startOrder(intent, session, callback);
        } else if ("CompleteOrderIntent" === intentName) {
            completeConfirm(intent, session, callback);
        } else if ("UndoOrderIntent" === intentName) {
            undoOrder(intent, session, callback);
        } else if ("DeleteOrderIntent" === intentName) {
            deleteConfirm(intent, session, callback);
        } else if ("QueueSummaryIntent" === intentName) {
            queueSummary(intent, session, callback);
        } else if ("AMAZON.HelpIntent" === intentName) {
            handleHelpRequest(intent, session, callback);
        } else if ("AMAZON.StopIntent" === intentName) {
            quitConfirm(intent, session, callback);
        } else {
            handleInvalidRequest(intent, session, callback);
        }
    }

}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {

    // todo: should probably add something for Alexa to say, like goodbye so that we don't get remote endpoint not found.

    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}

// ------- Session Initialization Skill Logic -------


var CARD_TITLE = "Sous Chef"; // Be sure to change this for your skill.

function getWelcomeResponse(callback) {
    var sessionAttributes = {},
        speechOutput = "Sous Chef here. How can I help you? ",
        shouldEndSession = false;

    //sets the state to "main"
    sessionAttributes = {};
    sessionAttributes.lang = "English";

    //outputs our speechOutput and waits for a response


    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
}

// ------- Logic to handle Recipe Assistant Main Menu -------

//This function handles the initfial request to find the desired recipe
function startOrder(intent, session, callback) {

    var shouldEndSession = false;

    //makes sure we have the appropriate session attributes or else instantiates them
    if (!session.attributes) {
        session.attributes = {};
    }


    var orderNumber,
        speechOutput;


    //checks to see that we received a recipe to retrieve
    if (intent.slots && intent.slots.orderNumber && intent.slots.orderNumber.value) {
        orderNumber = parseInt(intent.slots.orderNumber.value);
    } else {
        speechOutput = "Sorry, but I didn't hear which order you wanted. ";
        callback(session.attributes, buildSpeechletResponse(CARD_TITLE,
            speechOutput, speechOutput, shouldEndSession));
        return;
    }
    
    session.attributes.number = orderNumber;

    //determines the search parameters for the recipe we want to find
    var params = {};
    params.TableName = "Orders";
    params.Key = {
        "Number": orderNumber
    };


    //retrieves the order from the dynamoDB
    dynamo.getItem(params, function(err, data) {
        console.log("HELLO");
        fetchData = data;
        //handles the case that the recipe was posted without ingredients
        if ( err || !fetchData || !fetchData.Item || !fetchData.Item.Number) {
            if (!err) {
                console.log(JSON.stringify(data));
            } else {
                console.log(err);
            }
            speechOutput = "Sorry, but that order does not exist. ";
            callback(session.attributes,
                buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
        } else  {
            session.attributes.data = data;
            if (!session.attributes.data.Item.Status || session.attributes.data.Item.Status === "New" ) {
                speechOutput = "Okay, starting order " + orderNumber + ". ";
        
                params.Key = {
                    "Number": orderNumber
                };
                params.UpdateExpression = "set #s = :s";
                params.ExpressionAttributeNames = {
                    "#s": "Status"
                };
                params.ExpressionAttributeValues = {
                    ":s":"In Progress",
                };
                params.ReturnValues = "UPDATED_NEW";
        
                dynamo.updateItem(params, function(err, data) {
                    if (err) {
                        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                        params.Key = {
                            "Number": 0
                        };
                        params.UpdateExpression = "set #s = :s, #i = :i";
                        params.ExpressionAttributeNames = {
                            "#s": "Status",
                            "#i": "Items"
                        };
                        params.ExpressionAttributeValues = {
                            ":s":"In Progress",
                            ":i": "" + orderNumber
                        };
        
                        params.ReturnValues = "UPDATED_NEW";
                        dynamo.updateItem(params, function(err, data) {
                            if (err) {
                                console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                            } else {
                                console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                                callback(session.attributes, buildSpeechletResponse(CARD_TITLE,
                                    speechOutput, speechOutput, shouldEndSession));
                            }
                        }); 
                    }
                });
        
        
            }  else {
                if (session.attributes.data.Item.Status === "In Progress") {
                    speechOutput = "This order is already in progress";
                } else if (session.attributes.data.Item.Status === "Complete"){
                    speechOutput = "This order has already been completed. ";
                    speechOutput += "If you'd like to work on it again, say. Undo order " + orderNumber + ". ";
                } else {
                    speechOutput = "Sorry, but that is not a valid order. ";
                }
                callback(session.attributes, buildSpeechletResponse(CARD_TITLE,
                    speechOutput, speechOutput, shouldEndSession));
            }
        }
    });
    
}

//This function compiles the list of ingredients from the data we retrieved from DynamoDB
function deleteConfirm(intent, session, callback) {


    //makes sure our session.attributes are instantiated correctly
    if (!session.attributes) {
        session.attributes = {};
    }
    


    var speechOutput, orderNumber;
    var shouldEndSession = false;


    //double checks that there are ingredients to compile into a list
    //checks to see that we received a recipe to retrieve
    if (intent.slots && intent.slots.orderNumber && intent.slots.orderNumber.value) {
        orderNumber = parseInt(intent.slots.orderNumber.value);
    } else {
        speechOutput = "Sorry, but I didn't hear which order you wanted. ";
        callback(session.attributes, buildSpeechletResponse(CARD_TITLE,
            speechOutput, speechOutput, shouldEndSession));
        return;
    }

    //determines the search parameters for the recipe we want to find
    var params = {};
    params.TableName = "Orders";
    params.Key = {
        "Number": orderNumber
    };


    //retrieves the order from the dynamoDB
    dynamo.getItem(params, function(err, data) {
        fetchData = data;
        //handles the case that the recipe was posted without ingredients
        if ( err || !fetchData || !fetchData.Item || !fetchData.Item.Number) {
            if (!err) {
                console.log(JSON.stringify(data));
            } else {
                console.log(err);
            }
            speechOutput = "Sorry, but that order does not exist. ";
            callback(session.attributes,
                buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
        } else  {
            session.attributes.data = data;
            if (!session.attributes.data.Item.Status || session.attributes.data.Item.Status !== "Delete") {
                speechOutput = "Are you sure you want to delete order " + orderNumber + "? ";
                session.attributes.state = "deleteConfirm";
            }  else {
                delete session.attributes.state;
                speechOutput = "Sorry, but that is not a valid order. ";
            }

            callback(session.attributes,
                buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
        }
    });
    
}

function deleteFinal(intent, session, callback) {

    //makes sure our session.attributes is instantiated correctly
    if (!session.attributes) {
        session.attributes = {};
    }

    delete session.attributes.state;

    var speechOutput = "";
    var shouldEndSession = false;

    var orderNumber = session.attributes.data.Item.Number;
    
    speechOutput = "Okay, deleting number " + orderNumber + ". ";
    
    var params = {};
    params.TableName = "Orders";
    params.Key = {
        "Number": orderNumber
    };
    
    params.UpdateExpression = "set #s = :s";
    params.ExpressionAttributeNames = {
        "#s": "Status"
    };
    params.ExpressionAttributeValues = {
        ":s" : "Delete",
    };
    params.ReturnValues = "UPDATED_NEW";
    
    dynamo.updateItem(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            params.Key = {
                "Number": 0
            };
            params.UpdateExpression = "set #s = :s, #i = :i";
            params.ExpressionAttributeNames = {
                "#s": "Status",
                "#i": "Items"
            };
            params.ExpressionAttributeValues = {
                ":s":"Delete",
                ":i": "" + orderNumber
            };
    
            params.ReturnValues = "UPDATED_NEW";
            dynamo.updateItem(params, function(err, data) {
                if (err) {
                    console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                }
            });

            callback(session.attributes,
                buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
        }
    });
    
}


//This function compiles the list of directions in the recipe after listing the ingredients
function completeConfirm(intent, session, callback) {

    //makes sure our session.attributes are instantiated correctly
    if (!session.attributes) {
        session.attributes = {};
    }



    var speechOutput, orderNumber;
    var shouldEndSession = false;


    //double checks that there are ingredients to compile into a list
    //checks to see that we received a recipe to retrieve
    if (intent.slots && intent.slots.orderNumber && intent.slots.orderNumber.value) {
        orderNumber = parseInt(intent.slots.orderNumber.value);
    } else {
        speechOutput = "Sorry, but I didn't hear which order you wanted. ";
        callback(session.attributes, buildSpeechletResponse(CARD_TITLE,
            speechOutput, speechOutput, shouldEndSession));
        return;
    }

    //determines the search parameters for the recipe we want to find
    var params = {};
    params.TableName = "Orders";
    params.Key = {
        "Number": orderNumber
    };


    //retrieves the order from the dynamoDB
    dynamo.getItem(params, function(err, data) {
        fetchData = data;
        //handles the case that the recipe was posted without ingredients
        if ( err || !fetchData || !fetchData.Item || !fetchData.Item.Number) {
            if (!err) {
                console.log(JSON.stringify(data));
            } else {
                console.log(err);
            }
            speechOutput = "Sorry, but that order does not exist. ";
            callback(session.attributes,
                buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
            
        } else  {
            session.attributes.data = data;
            if (!session.attributes.data.Item.Status || session.attributes.data.Item.Status !== "Complete") {
                speechOutput = "Complete order " + orderNumber + "? ";
                session.attributes.state = "completeConfirm";
            }  else {
                delete session.attributes.state;
                speechOutput = "Sorry, but that order has already been completed. ";
            }
            callback(session.attributes,
                buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
        }
    });

}

//iterates through the list of directions we previously compiled
function completeFinal(intent, session, callback) {


    delete session.attributes.state;
    var speechOutput = "";
    var shouldEndSession = false;
    
    var orderNumber = session.attributes.data.Item.Number;
    
    var params = {};
    params.TableName = "Orders";
    params.Key = {
        "Number": orderNumber
    };
    
    params.UpdateExpression = "set #s = :s";
    params.ExpressionAttributeNames = {
        "#s": "Status",
    };
    params.ExpressionAttributeValues = {
        ":s" : "Complete",
    };
    params.ReturnValues = "UPDATED_NEW";
    
    dynamo.updateItem(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            params.Key = {
            "Number": 0
            };
            params.UpdateExpression = "set #s = :s, #i = :i";
            params.ExpressionAttributeNames = {
                "#s": "Status",
                "#i": "Items"
            };
            params.ExpressionAttributeValues = {
                ":s":"Complete",
                ":i": "" + orderNumber
            };
            params.ReturnValues = "UPDATED_NEW";
            dynamo.updateItem(params, function(err, data) {
                if (err) {
                    console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                }
            });
            callback(session.attributes,
                buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
        }
    });
    
    
}

function undoOrder(intent, session, callback) {
    
    var shouldEndSession = false;

    //makes sure we have the appropriate session attributes or else instantiates them
    if (!session.attributes) {
        session.attributes = {};
    }


    var orderNumber,
        speechOutput;


    //checks to see that we received a recipe to retrieve
    if (intent.slots && intent.slots.orderNumber && intent.slots.orderNumber.value) {
        orderNumber = parseInt(intent.slots.orderNumber.value);
    } else {
        speechOutput = "Sorry, but I didn't hear which order you wanted. ";
        callback(session.attributes, buildSpeechletResponse(CARD_TITLE,
            speechOutput, speechOutput, shouldEndSession));
        return;
    }

    //determines the search parameters for the recipe we want to find
    var params = {};
    params.TableName = "Orders";
    params.Key = {
        "Number": orderNumber
    };


    //retrieves the order from the dynamoDB
    dynamo.getItem(params, function(err, data) {
        fetchData = data;
        //handles the case that the recipe was posted without ingredients
        if ( err || !fetchData || !fetchData.Item || !fetchData.Item.Number) {
            if (!err) {
                console.log(JSON.stringify(data));
            } else {
                console.log(err);
            }
            speechOutput = "Sorry, but that order does not exist. ";
            callback(session.attributes, buildSpeechletResponse(CARD_TITLE,
                speechOutput, speechOutput, shouldEndSession));
        } else  {
            session.attributes.data = data;
            if (session.attributes.data.Item.Status && 
                (session.attributes.data.Item.Status === "Complete" || 
                    session.attributes.data.Item.Status === "In Progress") ) {
                
                speechOutput = "Undoing order " + orderNumber + ". ";
        
                params.Key = {
                    "Number": orderNumber
                };
                params.UpdateExpression = "set #s = :s";
                params.ExpressionAttributeNames = {
                    "#s": "Status",
                };
                params.ExpressionAttributeValues = {
                    ":s" : "New",
                };
                params.ReturnValues = "UPDATED_NEW";
        
                dynamo.updateItem(params, function(err, data) {
                    if (err) {
                        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                    }
                });
        
        
                params.Key = {
                    "Number": 0
                };
                params.UpdateExpression = "set #s = :s, #i = :i";
                params.ExpressionAttributeNames = {
                    "#s": "Status",
                    "#i": "Items"
                };
                params.ExpressionAttributeValues = {
                    ":s":"Undo",
                    ":i": "" + orderNumber
                };
        
                params.ReturnValues = "UPDATED_NEW";
                dynamo.updateItem(params, function(err, data) {
                    if (err) {
                        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                        callback(session.attributes, buildSpeechletResponse(CARD_TITLE,
                            speechOutput, speechOutput, shouldEndSession));
                    }
                });
            } else {
                if (session.attributes.data.Item.Status && session.attributes.data.Item.Status === "New"){
                    speechOutput = "This order does not need to be undone. ";
                } else {
                    speechOutput = "Sorry, but that is not a valid order. ";
                }
                callback(session.attributes, buildSpeechletResponse(CARD_TITLE,
                    speechOutput, speechOutput, shouldEndSession));
            }
        }
    });
    
    
}

function queueSummary(intent, session, callback) {
    
    var speechOutput = "";
    var shouldEndSession = false;
    
    var params = {};
    params.TableName = "Orders";
    params.FilterExpression = "#s = :s";
    params.ExpressionAttributeNames = {
        "#s": "Status",
    };
    params.ExpressionAttributeValues = {
        ":s": "In Progress",
    };
    
    var outStr = "";
    dynamo.scan(params, function(err, data) {
        if (err) {
            console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            console.log(JSON.stringify(data));
            var numItems = 0;
            data.Items.forEach(function(item) {
                if (item.Status === "In Progress") {
                    numItems++;
                }
            });
            if (numItems === 0 ) {
                speechOutput = "Sorry, but there are no current orders to summarize.";
                callback(session.attributes, buildSpeechletResponse(CARD_TITLE,
                        speechOutput, speechOutput, shouldEndSession));
            }
            data.Items.forEach(function(item) {
                if (outStr.indexOf(item.Items) === -1) {
                    var counter = 0;
                    var queryStr = item.Items;
                    data.Items.forEach(function(item) {
                        if (item.Items === queryStr) {
                            counter++;
                        }
                    });
                    outStr += counter + " " + queryStr +"<br>";
                }
            });
            params = {};
            params.TableName = "Orders";
            params.Key = {
                "Number": 0
            };
            params.UpdateExpression = "set #s = :s, #i = :i";
            params.ExpressionAttributeNames = {
                "#s": "Status",
                "#i": "Items"
            };
            params.ExpressionAttributeValues = {
                ":s":"Summary",
                ":i": outStr
            };
            params.ReturnValues = "UPDATED_NEW";
            dynamo.updateItem(params, function(err, data) {
                if (err) {
                    console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                    callback(session.attributes, buildSpeechletResponse(CARD_TITLE,
                        speechOutput, speechOutput, shouldEndSession));
                }
            });
        
            callback(session.attributes,
                buildSpeechletResponseWithoutCard(speechOutput, speechOutput, shouldEndSession));
        }
    });
}


function handleHelpRequest(intent, session, callback) {

    var speechOutput = "Here are some example commands. \n";
    var shouldEndSession = false;

    //if we manage to call this function without a state
    //this should never be true


    if (!session.attributes) {
        session.attributes = {};
    }
    if (session.attributes.state && session.attributes.state === "POTATO") {
        speechOutput += "Open Sous Chef.";
    } else {
        speechOutput += "Start order 8.\n";
        speechOutput += "Complete order 8.\n";
        speechOutput += "Delete order 8.\n";
        speechOutput += "Undo order 8.\n";
        speechOutput += "Give me a queue summary. \nQuit.\n";
        speechOutput += "You can also say 'what can I say' to hear this list again. \n";
    }


    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speechOutput, speechOutput, shouldEndSession));
}

function quitConfirm(intent, session, callback) {

    if (!session.attributes || !session.attributes.state ) {
        session.attributes.state = "quitConfirm";
    }

    var speechOutput = "Would you really like to quit? ";

    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speechOutput, speechOutput, false));
}


function quitFinal(intent, session, callback) {

    delete session.attributes.state;

    handleFinishSessionRequest(intent, session, callback);
}


function handleInvalidRequest(intent, session, callback) {

    var speechOutput;
    speechOutput = "I'm sorry, but that is not a valid command. "
        + "Please say 'what can i say?' for a list of commands. ";

    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speechOutput, speechOutput, false));
}

function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the recipe assistant
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye!", "", true));
}

function returnToMain(intent, session, callback) {
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("", "", false));
}

// ------- Helper functions to build responses -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

