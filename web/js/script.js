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
        updateOrderCounter(count);


        var newHTML = '';
        var progressHTML = '';
        var completedHTML = '';
        for (var i = 0; i < itemArray.length; i++) {
            if (itemArray[i]["Status"] === "Complete") {
                completedHTML += makeCompleteOrderHTML(itemArray[i]);
            } else if (itemArray[i]["Status"] === "New") {
                newHTML += makeCurrentOrderNewHTML(itemArray[i]);
            } else if (itemArray[i]["Status"] === "In Progress") {
                progressHTML += makeCurrentOrderProgressHTML(itemArray[i]);
            }

        }


        $("#currentorders").html(newHTML + progressHTML);
        $("#completedorders").html(completedHTML);

        instantiateItems(itemArray);

    });

});

var itemsArray;
var orderCounter;
var incompleteOrders = false;
var itemInfo;

function instantiateItems(items) {
    itemsArray = items;
}

function updateOrderCounter(num) {
    orderCounter = num;
}

function makeCurrentOrderNewHTML(detailArray) {
    var itemNum = detailArray["Number"];
    var item = detailArray["Items"];

    if (itemNum === 0) {
        return '';
    }

    var html = '';

    html += '<div class="box"' + ' id="itemNum_' + itemNum  + '"><div class="new-order"> <div class="box-close"> <button type="button" class="close orders" id="closeID_' + itemNum + '" onclick="closeBtnClicked(this.id)" aria-label="Close"> <span aria-hidden="true">&times;</span> </button> </div>';
    html += '<p class="body-text"></p> #' + itemNum + '<br>';
    html += item + '</p>';
    html += '</div><button type="button" class="btn main sharp green" id="btnStart_' + itemNum + '" onclick="startBtnClicked(this.id)">START</button></div>';

    return html;
}

function makeCurrentOrderProgressHTML(detailArray) {
    var itemNum = detailArray["Number"];
    var item = detailArray["Items"];
    if (itemNum === 0) {
        return '';
    }

    var html = '';
    html += '<div class="box"' + ' id="itemNum_' + itemNum  + '"><div class="progress-order"> <div class="box-close"> <button type="button" class="close orders" id="closeID_' + itemNum + '" onclick="closeBtnClicked(this.id)"aria-label="Close"> <span aria-hidden="true">&times;</span> </button> </div>';
    html += '#' + itemNum + '<br>';
    html += item;
    html += '</div><button type="button" class="btn main sharp green" id="btnDone_' + itemNum + '" onclick="doneBtnClicked(this.id)">DONE</button></div>';
    return html;

}

function makeCompleteOrderHTML(detailArray) {
    var itemNum = detailArray["Number"];
    var item = detailArray["Items"];

    if (itemNum === 0) {
        return '';
    }

    var html = '';

    html += '<div class="box"' + ' id="itemNum_' + itemNum  + '"><div class="new-order">';

    html += '#' + itemNum + '<br>';
    html += item;

    html += '</div><button type="button" class="btn main sharp yellow" id="btnUndo_' + itemNum + '" onclick="undoBtnClicked(this.id)">UNDO</button></div>';

    return html;

}

function hideCompleted() {
    $("#completedorders").hide(1000);
    $("#collapseBtnHide").show();
    $("#collapseBtnShow").hide();
}

function showCompleted() {
    $("#completedorders").show(1000);
    $("#collapseBtnHide").hide();
    $("#collapseBtnShow").show();
}

function startBtnClicked(itemNum) {
    var index = itemNum.indexOf('_');
    var itemArrayIndex = itemNum.substring(index + 1);
    var item = findMatchingID(itemArrayIndex);
    var order = item["Items"];

    $.ajax({
        url: 'https://qdo50pch11.execute-api.us-east-1.amazonaws.com/prod/OrdersAssistant',
        type: 'POST',
        data: JSON.stringify({"TableName": "Orders", "Item": {"Items":order, "Number":item["Number"], "Status":"In Progress"}}),
        success: function(data) {

        },
        error: function(xhr, ajaxOptions, thrownError) {
            alert("Error");
        }
    });

    $.get("https://qdo50pch11.execute-api.us-east-1.amazonaws.com/prod/OrdersAssistant?TableName=Orders", function(data, status) {
        $("#result").text(JSON.stringify(data));
        var db = JSON.stringify(data);
        jsonText = db;
        var json = $.parseJSON(jsonText);

        /* instantiating some of the things */
        var itemArray = json["Items"];
        instantiateItems(itemArray);
    });

    var idName = '#itemNum_' + itemArrayIndex;
    var html = makeCurrentOrderProgressHTML(item);

    $(idName).remove();
    $("#currentorders").append(html);

}

function undoBtnClicked(itemNum) {
    var index = itemNum.indexOf('_');
    var itemArrayIndex = itemNum.substring(index + 1);
    var item = findMatchingID(itemArrayIndex);
    var order = item["Items"];

    $.ajax({
        url: 'https://qdo50pch11.execute-api.us-east-1.amazonaws.com/prod/OrdersAssistant',
        type: 'POST',
        data: JSON.stringify({"TableName": "Orders", "Item": {"Items":order, "Number":item["Number"], "Status":"New"}}),
        success: function(data) {

        },
        error: function(xhr, ajaxOptions, thrownError) {
            alert("Error");
        }
    });

    $.get("https://qdo50pch11.execute-api.us-east-1.amazonaws.com/prod/OrdersAssistant?TableName=Orders", function(data, status) {
        $("#result").text(JSON.stringify(data));
        var db = JSON.stringify(data);
        jsonText = db;
        var json = $.parseJSON(jsonText);

        /* instantiating some of the things */
        var itemArray = json["Items"];
        instantiateItems(itemArray);
    });

    var idName = '#itemNum_' + itemArrayIndex;
    var html = makeCurrentOrderNewHTML(item);

    $(idName).remove();
    $("#currentorders").prepend(html);
}

function closeBtnClicked(itemNum) {
    var index = itemNum.indexOf('_');
    var itemArrayIndex = itemNum.substring(index + 1);
    var item = findMatchingID(itemArrayIndex);
    var order = item["Items"];

    var html = 'Order ' + itemArrayIndex + ': ' + order;
    itemInfo = itemNum;
    $("#confirm-modal-txt").html(html);
    $('#confirmDelete').modal('toggle');

}

function toggleDelete() {
    $('#confirmDelete').modal('toggle');
}

function deleteItem() {
    var itemNum = itemInfo;
    itemInfo = '';
    var index = itemNum.indexOf('_');
    var itemArrayIndex = itemNum.substring(index + 1);
    var item = findMatchingID(itemArrayIndex);
    var order = item["Items"];

    $.ajax({
        url: 'https://qdo50pch11.execute-api.us-east-1.amazonaws.com/prod/OrdersAssistant',
        type: 'POST',
        data: JSON.stringify({"TableName": "Orders", "Item": {"Items":order, "Number":item["Number"], "Status":"Delete"}}),
        success: function(data) {

        },
        error: function(xhr, ajaxOptions, thrownError) {
            alert("Error");
        }
    });

    $.get("https://qdo50pch11.execute-api.us-east-1.amazonaws.com/prod/OrdersAssistant?TableName=Orders", function(data, status) {
        $("#result").text(JSON.stringify(data));
        var db = JSON.stringify(data);
        jsonText = db;
        var json = $.parseJSON(jsonText);

        /* instantiating some of the things */
        var itemArray = json["Items"];
        instantiateItems(itemArray);
    });


    var idName = '#itemNum_' + item["Number"];
    $(idName).remove();
    $('#confirmDelete').modal('toggle');
}

function doneBtnClicked(itemNum) {
    var index = itemNum.indexOf('_');
    var itemArrayIndex = itemNum.substring(index + 1);
    var item = findMatchingID(itemArrayIndex);
    var order = item["Items"];

    var html = 'Order ' + itemArrayIndex + ': ' + order;
    itemInfo = itemNum;
    $("#complete-modal-txt").html(html);
    $('#confirmComplete').modal('toggle');

}

function toggleComplete() {
    $('#confirmComplete').modal('toggle');
}

function completeYes() {
    var itemNum = itemInfo;
    itemInfo = '';
    var index = itemNum.indexOf('_');
    var itemArrayIndex = itemNum.substring(index + 1);
    var item = findMatchingID(itemArrayIndex);
    var order = item["Items"];

    $.ajax({
        url: 'https://qdo50pch11.execute-api.us-east-1.amazonaws.com/prod/OrdersAssistant',
        type: 'POST',
        data: JSON.stringify({"TableName": "Orders", "Item": {"Items":order, "Number":item["Number"], "Status":"Complete"}}),
        success: function(data) {

        },
        error: function(xhr, ajaxOptions, thrownError) {
            alert("Error");
        }
    });
    $.get("https://qdo50pch11.execute-api.us-east-1.amazonaws.com/prod/OrdersAssistant?TableName=Orders", function(data, status) {
        $("#result").text(JSON.stringify(data));
        var db = JSON.stringify(data);
        jsonText = db;
        var json = $.parseJSON(jsonText);

        /* instantiating some of the things */
        var itemArray = json["Items"];
        instantiateItems(itemArray);
    });


    var idName = '#itemNum_' + item["Number"];
    html = makeCompleteOrderHTML(item);

    $(idName).remove();
    $("#completedorders").append(html);
    $('#confirmComplete').modal('toggle');
}

function findMatchingID(id) {
    for (var i = 0; i < itemsArray.length; i++) {
        if (itemsArray[i]["Number"] == id) {
            return itemsArray[i];
        }
    }

    return null;
}

function doPoll() {

    $.get("https://qdo50pch11.execute-api.us-east-1.amazonaws.com/prod/OrdersAssistant?TableName=Orders", function(data, status) {
        $("#result").text(JSON.stringify(data));
        var db = JSON.stringify(data);
        jsonText = db;
        var json = $.parseJSON(jsonText);
        var items = json["Items"];
        var allItemsArray = json["Items"];
        instantiateItems(allItemsArray);
        var newItem = findMatchingID(0)["Items"];
        var status = findMatchingID(0)["Status"];

        if (json["Count"] != orderCounter) {
            // this means there is a new order incoming
            // how to get the newest item

            var newItem = findMatchingID(0)["Items"];
            var stringArray = {"Items":newItem, "Number":orderCounter, "Status":"New"};

            var html = makeCurrentOrderNewHTML(stringArray);
            updateOrderCounter(json["Count"]);
            updateZero();
            $("#currentorders").prepend(html);
            displayOrderNotification(stringArray);
        } else if (status === "Summary") {
            $("#modal-body-txt").html(newItem);
            updateZero();
            openModal();
        } else if (status === "In Progress") {
            var updatedItem = findMatchingID(newItem);
            var html = makeCurrentOrderProgressHTML(updatedItem);
            var idName = '#itemNum_' + updatedItem["Number"];
            $(idName).remove();

            $("#currentorders").append(html);
            updateZero();
        } else if (status === "Delete") {
            var updatedItem = findMatchingID(newItem);
            var idName = '#itemNum_' + findMatchingID(0)["Items"];
            $(idName).remove();

            updateZero();
        } else if (status === "Undo") {
            var updatedItem = findMatchingID(newItem);
            var html = makeCurrentOrderNewHTML(updatedItem);
            var idName = '#itemNum_' + updatedItem["Number"];
            $(idName).remove();
            // console.log("UNDOING");
            $("#currentorders").prepend(html);
            updateZero();
        } else if (status === "Complete") {
            var updatedItem = findMatchingID(newItem);
            var html = makeCompleteOrderHTML(updatedItem);
            var idName = '#itemNum_' + updatedItem["Number"];
            $(idName).remove();

            $("#completedorders").append(html);
            updateZero();

        }

    });


}

setInterval(function(){ doPoll(); }, 5000);

function displayOrderNotification(item) {
    var popup = document.getElementById("myPopup");
    // popup.html("DOES THIS WORK");
    var orderDetail = 'Order ' + item["Number"] + ': ' + item["Items"];
    var newHtml = '<div class="box-close"> <button type="button" class="close orders" onclick="closePopUp()" aria-label="Close"> <span aria-hidden="true">&times;</span> </button> </div>';
    newHtml += '<div class="order-notif">Order Notification</div> <br> <div class="order-detail">' + orderDetail + '</div>';
    $("#myPopup").html(newHtml);
    popup.classList.toggle("show");
    // $("#myPopup").show();
    setTimeout(function() { popup.classList.toggle("show").fadeOut; }, 4000);
}

function closePopUp() {
    var popup = document.getElementById("myPopup");
    popup.classList.toggle("show");
}



function updateZero() {
    $.ajax({
        url: 'https://qdo50pch11.execute-api.us-east-1.amazonaws.com/prod/OrdersAssistant',
        type: 'POST',
        data: JSON.stringify({"TableName": "Orders", "Item": {"Items":"Nothing", "Number":0, "Status":"New"}}),
        success: function(data) {
            // alert("Updating 0th Order!");
        },
        error: function(xhr, ajaxOptions, thrownError) {
            alert("Error updating 0");
        }
    });
}

function openModal() {
    $('#myModal').modal('toggle');
}

