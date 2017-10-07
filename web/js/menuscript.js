/**
 * Created by nguyetduong on 4/25/17.
 */
$(document).ready(function() {
    $.get("https://qdo50pch11.execute-api.us-east-1.amazonaws.com/prod/OrdersAssistant?TableName=Orders", function(data, status) {
        // alert("Data: " + data + "\nStatus: " + status);

        /* setting up the json file to read */
        $("#result").text(JSON.stringify(data));
        var db = JSON.stringify(data);
        jsonText = db;
        var json = $.parseJSON(jsonText);

        /* instantiating some of the things */
        var itemArray = json["Items"];
        var count = json["Count"];
        console.log(count);
        updateOrderCounter(count);


    });

});

var orderCounter;

function updateOrderCounter(num) {
    orderCounter = num;
}


function sendOrder() {
    var orderName = $("#orderName").val();
    updateOrderCounter(orderCounter);
    $.ajax({
        url: 'https://qdo50pch11.execute-api.us-east-1.amazonaws.com/prod/OrdersAssistant',
        type: 'POST',
        data: JSON.stringify({"TableName": "Orders", "Item": {"Items":orderName, "Number":orderCounter, "Status":"New"}}),
        success: function(data) {
            alert("Order has been sent!");
        },
        error: function(xhr, ajaxOptions, thrownError) {
            alert("Error");
        }
    });

    updateZero(orderName);

    console.log("sending order: " + orderCounter);

    updateOrderCounter(orderCounter + 1);

}

function updateZero(items) {
    $.ajax({
        url: 'https://qdo50pch11.execute-api.us-east-1.amazonaws.com/prod/OrdersAssistant',
        type: 'POST',
        data: JSON.stringify({"TableName": "Orders", "Item": {"Items":items, "Number":0, "Status":"New"}}),
        success: function(data) {
            // alert("Updating 0th Order!");
        },
        error: function(xhr, ajaxOptions, thrownError) {
            alert("Error updating 0");
        }
    });
}