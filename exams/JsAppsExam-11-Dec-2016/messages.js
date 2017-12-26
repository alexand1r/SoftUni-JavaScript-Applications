function startApp() {
    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_Hkvy6Oq7l";
    const kinveyAppSecret =
        "a35952c1060444f89a48bf14987f3c1f";
    const kinveyAppAuthHeaders = {
        'Authorization': "Basic " +
        btoa(kinveyAppKey + ":" + kinveyAppSecret),
    };

    sessionStorage.clear(); // Clear user auth data
    hideMessageBoxes();
    showHideMenuLinks();
    showAppHomeView();
    // Bind the navigation menu links
    $("#linkMenuAppHome").click(showAppHomeView);
    $("#linkMenuLogin").click(showLoginView);
    $("#linkMenuRegister").click(showRegisterView);

    $("#linkMenuUserHome").click(showUserHomeView);
    $("#linkMenuMyMessages").click(showListMyMessagesView);
    $("#linkMenuArchiveSent").click(showArchiveView);
    $("#linkMenuSendMessage").click(showSendMessageView);
    $("#linkMenuLogout").click(logoutUser);

    $("#linkUserHomeMyMessages").click(showListMyMessagesView);
    $("#linkUserHomeSendMessage").click(showSendMessageView);
    $("#linkUserHomeArchiveSent").click(showArchiveView);

    // Bind the form submit buttons
    $(document).ready(function() {
        $("#formLogin").submit(function(event){
            event.preventDefault();
            loginUser();
        });
        $("#formRegister").submit(function(event) {
            event.preventDefault();
            registerUser();
        });
        $("#formSendMessage").submit(function(event) {
            event.preventDefault();
            sendMessage();
        });
    });

    $("#infoBox, #errorBox").click(function () {
        $(this).fadeOut();
    });

    // Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show()
        },
        ajaxStop: function () {
            $("#loadingBox").hide()
        }
    });

    function showHideMenuLinks() {
        $("#linkMenuAppHome").show();
        if (sessionStorage.getItem('authToken')) {
            // We have logged in user
            $("#linkMenuAppHome").hide();
            $("#linkMenuLogin").hide();
            $("#linkMenuRegister").hide();

            $("#linkMenuUserHome").show();
            $("#linkMenuMyMessages").show();
            $("#linkMenuArchiveSent").show();
            $("#linkMenuSendMessage").show();
            $("#linkMenuLogout").show();
            $("#spanMenuLoggedInUser").show();

        } else {
            // No logged in user
            $("#linkMenuAppHome").show();
            $("#linkMenuLogin").show();
            $("#linkMenuRegister").show();

            $("#linkMenuUserHome").hide();
            $("#linkMenuMyMessages").hide();
            $("#linkMenuArchiveSent").hide();
            $("#linkMenuSendMessage").hide();
            $("#linkMenuLogout").hide();
            $("#spanMenuLoggedInUser").hide();
        }
    }

    function showView(viewName) {
        $('#errorBox').hide();
        // Hide all views and show the selected view only
        $('main > section').hide();
        $('#' + viewName).show();
    }

    function showAppHomeView() {
        showView('viewAppHome');
    }

    function showLoginView() {
        $('#formLogin').trigger('reset');
        showView('viewLogin');
    }

    function showRegisterView() {
        $('#formRegister').trigger('reset');
        showView('viewRegister');
    }

    function showUserHomeView() {
        $('#viewUserHomeHeading').text(
            "Welcome, " + sessionStorage.getItem('user') + "!");

        showView('viewUserHome');
    }

    function showListMyMessagesView() {
        $('#myMessages').empty();
        showView('viewMyMessages');
        $.ajax({
            method: "GET",
            url: `${kinveyBaseUrl}appdata/${kinveyAppKey}/messages/?query={"recipient_username":"${sessionStorage.getItem('user')}"}`,
            headers: getKinveyUserAuthHeaders(),
            success: loadMessagesSuccess,
            error: handleAjaxError
        });

        function loadMessagesSuccess(messages) {
            let messagesTable = $('<table>')
                .append($('<tr>').append(
                    '<th>From</th><th>Message</th>',
                    '<th>Date Received</th>'));
            showInfo('Received messages loaded.');
            if (messages.length == 0) {
                $('#myMessages').append(messagesTable);
            } else {
                for (let message of messages)
                    appendMessageRow(message, messagesTable);
                $('#myMessages').append(messagesTable);
            }
        }

        function appendMessageRow(message, messagesTable) {
            let sender = formatSender(message['sender_name'], message['sender_username']);
            let messageText = message.text;
            let date = formatDate(message._kmd.lmt);
            messagesTable.append($('<tr>').append(
                $('<td>').text(sender),
                $('<td>').text(messageText),
                $('<td>').text(date)
            ));
        }
    }

    function showArchiveView() {
        $('#sentMessages').empty();
        showView('viewArchiveSent');
        $.ajax({
            method: "GET",
            url: `${kinveyBaseUrl}appdata/${kinveyAppKey}/messages/?query={"sender_username":"${sessionStorage.getItem('user')}"}`,
            headers: getKinveyUserAuthHeaders(),
            success: loadSentMessagesSuccess,
            error: handleAjaxError
        });

        function loadSentMessagesSuccess(messages) {
            let messagesTable = $('<table>')
                .append($('<tr>').append(
                    '<th>To</th><th>Message</th>',
                    '<th>Date Sent</th><th>Actions</th>'));
            showInfo('Sent messages loaded.');
            if (messages.length == 0) {
                $('#sentMessages').append(messagesTable);
            } else {
                for (let message of messages)
                    appendMessageRow(message, messagesTable);
                $('#sentMessages').append(messagesTable);
            }
        }

        function appendMessageRow(message, messagesTable) {
            let recipient = formatSender(null, message['recipient_username']);
            let messageText = message.text;
            let date = formatDate(message._kmd.lmt);
            let links = [];
            if (message._acl.creator == sessionStorage.getItem('userId')) {
                let deleteLink = $('<a href="#"><button>Delete</button></a>')
                    .click(function() { deleteMessage(message) });
                links = [deleteLink];
            }
            messagesTable.append($('<tr>').append(
                $('<td>').text(recipient),
                $('<td>').text(messageText),
                $('<td>').text(date),
                $('<td>').append(links)
            ));

            function deleteMessage(message) {
                $.ajax({
                    method: "DELETE",
                    url: `${kinveyBaseUrl}appdata/${kinveyAppKey}/messages/${message._id}`,
                    headers: getKinveyUserAuthHeaders(),
                    success: deleteMessageSuccess,
                    error: handleAjaxError
                });
                function deleteMessageSuccess() {
                    showArchiveView();
                    showInfo('Message deleted.');
                }
            }
        }
    }

    function showSendMessageView() {
        $('#formSendMessage').trigger('reset');
        showView('viewSendMessage');
        $.ajax({
            method: "GET",
            url: `${kinveyBaseUrl}user/${kinveyAppKey}/`,
            headers: getKinveyUserAuthHeaders(),
            success: loadUsersSuccess,
            error: handleAjaxError
        });

        function loadUsersSuccess(users) {
            $('#msgRecipientUsername option').remove();
            for (let user of users) {
                let recipientName = (user.name === '') ? null : user.name;
                let name = formatSender(recipientName, user.username);
                let option = $('<option>')
                    .attr('value', user.username)
                    .text(name);
                $('#msgRecipientUsername').append(option);
            }
        }
    }

    function sendMessage() {
        let rName = $('#msgRecipientUsername option:selected').text();
        let rUserName =  rName.split(' ')[0];

        let sendData = {
            sender_username: sessionStorage.getItem('user'),
            sender_name: sessionStorage.getItem('name'),
            recipient_username: rUserName,
            text: $('#formSendMessage input[name=text]').val()
        };
        $.ajax({
            method: "POST",
            url: `${kinveyBaseUrl}appdata/${kinveyAppKey}/messages`,
            headers: getKinveyUserAuthHeaders(),
            data: sendData,
            success: createMessageSuccess,
            error: handleAjaxError
        });
        function createMessageSuccess(response) {
            showArchiveView();
            showInfo('Message sent.');
        }
    }

    function registerUser() {
        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=password]').val(),
            name: $('#formRegister input[name=name]').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });
        function registerSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showUserHomeView();
            showInfo('User registration successful.');
        }
    }

    function loginUser() {
        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=password]').val()
        };
        $.ajax({
            method: "POST",
            url: `${kinveyBaseUrl}user/${kinveyAppKey}/login`,
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: loginSuccess,
            error: handleAjaxError
        });
        function loginSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showUserHomeView();
            showInfo('Login successful.');
        }
    }

    function logoutUser() {
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/_logout",
            headers: getKinveyUserAuthHeaders(),
            success: logoutSuccess,
            error: handleAjaxError
        });
        function logoutSuccess() {
            sessionStorage.clear();
            $('#spanMenuLoggedInUser').text("");
            showHideMenuLinks();
            showView('viewAppHome');
            showInfo('Logout successful.');
        }
    }

    function getKinveyUserAuthHeaders() {
        return {
            'Authorization': "Kinvey " +
            sessionStorage.getItem('authToken'),
        };
    }

    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        sessionStorage.setItem('user', username);
        let name = userInfo.name;
        sessionStorage.setItem('name', name);
        $('#spanMenuLoggedInUser').text(
            "Welcome, " + username + "!");
    }

    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON &&
            response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }

    function hideMessageBoxes() {
        $('#infoBox').hide();
        $('#loadingBox').hide();
        $('#errorBox').hide();
    }

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function() {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }

    function formatDate(dateISO8601) {
        let date = new Date(dateISO8601);
        if (Number.isNaN(date.getDate()))
            return '';
        return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
            "." + date.getFullYear() + ' ' + date.getHours() + ':' +
            padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

        function padZeros(num) {
            return ('0' + num).slice(-2);
        }
    }

    function formatSender(name, username) {
        if (!name)
            return username;
        else
            return username + ' (' + name + ')';
    }

}