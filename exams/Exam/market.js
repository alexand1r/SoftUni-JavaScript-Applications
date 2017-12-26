/**
 * Created by steff on 22.12.2016 г..
 */
function startApp(){
    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_SkCMj-tEe";
    const kinveyAppSecret =
        "b4277d439ccd471bb9f69172dae4c14a";
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
    $("#linkMenuShop").click(showMenuShopView);
    $("#linkMenuCart").click(showMenuCartView);
    $("#linkMenuLogout").click(logoutUser);

    $("#linkUserHomeShop").click(showMenuShopView);
    $("#linkUserHomeCart").click(showMenuCartView);

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
          //  sendMessage();
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
            $("#linkMenuShop").show();
            $("#linkMenuCart").show();
            $("#linkMenuLogout").show();
            $("#spanMenuLoggedInUser").show();

        } else {
            // No logged in user
            $("#linkMenuAppHome").show();
            $("#linkMenuLogin").show();
            $("#linkMenuRegister").show();

            $("#linkMenuUserHome").hide();
            $("#linkMenuShop").hide();
            $("#linkMenuCart").hide();
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
    
    function showMenuShopView() {
        $('#shopProducts').empty();
        showView('viewShop');
        $.ajax({
            method: "GET",
            url: `${kinveyBaseUrl}appdata/${kinveyAppKey}/products`,
            headers: getKinveyUserAuthHeaders(),
            success: loadProductsSuccess,
            error: handleAjaxError
        });

        function loadProductsSuccess(products) {
            let productTable = $('<table>')
                .append($('<tr>').append(
                    ' <th>Product</th><th>Description</th>',
                    '<th>Price</th><th>Actions</th>'));
            showInfo('Products loaded.');
            if (products.length == 0) {
                $('#shopProducts').append(productTable);
            } else {
                for (let product of products)
                    appendProductRow(product, productTable);
                $('#shopProducts').append(productTable);
            }
        }

        function appendProductRow(product, productTable) {
            let purchaseLink = $('<a href="#"><button>Purchase</button></a>')
                .click(function() { purchaseProduct(product) });
            productTable.append($('<tr>').append(
                $('<td>').text(product.name),
                $('<td>').text(product.description),
                $('<td>').text((Number(product.price)).toFixed(2)),
                $('<td>').append(purchaseLink)
            ));
        }
    }

   function purchaseProduct (product) {
       $.ajax({
           method: "GET",
           url: `${kinveyBaseUrl}user/${kinveyAppKey}/${sessionStorage.getItem('userId')}`,
           headers: getKinveyUserAuthHeaders(),
           success: makePurchase,
           error: handleAjaxError
       });

       function makePurchase(user) {
           let purchaseArr = {};
           if (user.cart !== undefined)
               purchaseArr = user.cart;

           if (purchaseArr[product._id] !== undefined) {
               purchaseArr[product._id].quantity = parseInt(purchaseArr[product._id].quantity) + 1;
           } else {
               purchaseArr[product._id] = {};
               purchaseArr[product._id].quantity = 1;
               purchaseArr[product._id].product = {
                   name: product.name,
                   description: product.description,
                   price: product.price
               }
           }

           user.cart = purchaseArr;

           $.ajax({
               method: "PUT",
               url: `${kinveyBaseUrl}user/${kinveyAppKey}/${sessionStorage.getItem('userId')}`,
               headers: getKinveyUserAuthHeaders(),
               data:user,
               success: function(data) {
                   console.log(data);
               },
               error: handleAjaxError
           });
       }
   }

    function showMenuCartView() {
        showView('viewCart');
        $.ajax({
            method: "GET",
            url: `${kinveyBaseUrl}user/${kinveyAppKey}/${sessionStorage.getItem('userId')}`,
            headers: getKinveyUserAuthHeaders(),
            success: showCart,
            error: handleAjaxError
        });

        function showCart(user) {
            let cart = user.cart;
            $('#cartProducts').empty();
            let productTable = $('<table>')
                .append($('<tr>').append(
                    ' <th>Product</th><th>Description</th>',
                    '<th>Quantity</th><th>Total Price</th><th>Actions</th>'));
            // showInfo('Products loaded.');
            if (cart.length == 0) {
                $('#cartProducts').append(productTable);
            } else {
                Object.keys(cart).forEach(function (key) {
                    appendProductRow(cart[key], key, productTable);
                    $('#cartProducts').append(productTable);
                });
            }

            function appendProductRow(product, key, productTable) {
                let discardLink = $('<a href="#"><button>Discard</button></a>')
                    .click(function() { discardProduct(key) });
                let obj = {quantity:parseInt(product.quantity)};
                Object.keys(product.product).forEach(function (key) {
                    if (key === 'name') obj['name'] = product.product.name;
                    if (key === 'description') obj['description'] = product.product.description;
                    if (key === 'price') obj['price'] = parseInt(product.product.price);
                });
                productTable.append($('<tr>').append(
                    $('<td>').text(obj.name),
                    $('<td>').text(obj.description),
                    $('<td>').text(obj.quantity),
                    $('<td>').text((obj.quantity * obj.price).toFixed(2)),
                    $('<td>').append(discardLink)
                ));
            }
        }
    }

    function discardProduct(product) {
        $.ajax({
            method: "GET",
            url: `${kinveyBaseUrl}user/${kinveyAppKey}/${sessionStorage.getItem('userId')}`,
            headers: getKinveyUserAuthHeaders(),
            success: discardPurchase,
            error: handleAjaxError
        });

        function discardPurchase(user) {
            let purchaseArr = {};
            if (user.cart !== undefined)
                purchaseArr = user.cart;

            if (purchaseArr[product] !== undefined) {
                delete purchaseArr[product];
            }

            user.cart = purchaseArr;

            $.ajax({
                method: "PUT",
                url: `${kinveyBaseUrl}user/${kinveyAppKey}/${sessionStorage.getItem('userId')}`,
                headers: getKinveyUserAuthHeaders(),
                data:user,
                success: function(data) {
                    console.log(data);
                    showMenuCartView();
                },
                error: handleAjaxError
            });
        }
    }

   

    //------------------register---------------------------//
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
    //------------------login-----------------------------//
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
    //-----------------LogOut------------------------------//
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
    //-----------------Error-------------------------------//
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
    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }
    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function() {
            $('#infoBox').fadeOut();
        }, 3000);
    }

}