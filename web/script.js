

serverAddress = "127.0.0.1"
port = 5000
globalUsers = []
selectedUser = ""
clientPort = "-1"
he = {}
me = {}


$("#scrollDown").click(() => {
    var div = document.getElementById("chat-messages")
    div.scrollTop = div.scrollHeight
})

function sendBase() {
    fetch('http://localhost:' + clientPort + '/send/' + selectedUser, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(to_send)
    })
        .then(response => response.json())
        .then((data) => {
        })
        .catch(error => console.error('Error:', error));



}
function send() {
    text = document.getElementById("text")

    to_send = text.value
    text.value = ""

    if (to_send != "") {






        fetch("http://" + serverAddress + ":" + port.toString() + "/port/" + getConnectedUserName(), {
            method: 'GET'
        })
            .then(response => response.json())
            .then((data) => {
                clientPort = data
                if (selectedUser == "chatroom") {
                    sendBase()
                } else {

                    fetch("http://" + serverAddress + ":" + port.toString() + "/port/" + selectedUser, {
                        method: 'GET'
                    })
                        .then(response => response.json())
                        .then((data) => {
                            if (data == "-1" || clientPort == -1) {
                                // run script
                                fetch("http://" + serverAddress + ":" + port.toString() + "/run/" + selectedUser, {
                                    method: 'GET'
                                })
                                    .then(response => response.json())
                                    .then((data) => {

                                    })
                                    .catch(error => console.error('Error:', error));

                                setTimeout(() => {
                                    sendBase()
                                }, 3000);
                            } else {
                                sendBase()
                            }


                        })
                        .catch(error => console.error('Error:', error));
                }
            })
            .catch(error => console.error(error))



    }
}
function getConnectedUserName() {
    return sessionStorage.getItem("user_name").slice(1, -1)
}
function getNSeconds(s) {
    x = s.split(':')
    ff = x[0].split(" ")
    yy = ff[0].split("-")
    y = "20" + yy[2] + "-" + yy[1] + "-" + yy[0] + " " + ff[1] + ":" + x[1] + ":" + x[2] + ":"
    x = x[3].substring(0, 3)
    d = new Date(Date.parse(y + x))
    return d.getTime()
}
callbackFriends = function (event) {
    var childOffset = $(this).offset();
    var parentOffset = $(this).parent().parent().offset();
    var childTop = childOffset.top - parentOffset.top;
    var clone = $(this).find('img').eq(0).clone();
    var top = childTop + 12 + "px";

    $(clone).css({ 'top': top }).addClass("floatingImg").appendTo("#chatbox");

    setTimeout(function () { $("#profile p").addClass("animate"); $("#profile").addClass("animate"); }, 100);
    setTimeout(function () {
        $("#chat-messages").addClass("animate");
        $('.cx, .cy').addClass('s1');
        setTimeout(function () { $('.cx, .cy').addClass('s2'); }, 100);
        setTimeout(function () { $('.cx, .cy').addClass('s3'); }, 200);
    }, 150);

    $('.floatingImg').animate({
        'width': "24%",
        'height': "13%",
        'left': '108px',
        'top': '20px'
    }, 200);


    var name = $(this).find("p strong").html();

    var email = ""
    for (let user of globalUsers) {
        if (user["user_name"] == $(this)[0].id) {
            email = user["mail"];
            selectedUser = user["user_name"]
            break;
        }
    }


    $("#profile p").html(name);
    $("#profile span").html(email);

    $(".message").not(".right").find("img").attr("src", $(clone).attr("src"));
    $('#friendslist').fadeOut();
    $('#chatview').fadeIn();


    $('#close').unbind("click").click(function () {
        $("#chat-messages, #profile, #profile p").removeClass("animate");
        $('.cx, .cy').removeClass("s1 s2 s3");
        $('.floatingImg').animate({
            'width': "40px",
            'top': top,
            'left': '12px'
        }, 200, function () { $('.floatingImg').remove() });

        setTimeout(function () {
            $('#chatview').fadeOut();
            $('#friendslist').fadeIn();
        }, 50);
    });

}

callbackProfile = function (event) {
    var childOffset = $(this).offset();
    var parentOffset = $(this).parent().parent().offset();
    var childTop = childOffset.top - parentOffset.top;
    var clone = $(this).find('img').eq(0).clone();
    var img = new Image();

    img.id = "profileImg"

    // getImage
    var image = "profile.jpg"
    fetch("http://" + serverAddress + ":" + port.toString() + "/getImage/" + getConnectedUserName(), {
        method: 'GET'
    })
        .then(response => response.json())
        .then((data) => {
            image = data

            let imageType = image.substring(0, image.indexOf(";base64,") + 8);

            // Get the Base64 data part
            let base64Data = image.substring(image.indexOf(";base64,") + 8);

            // Use the atob function to decode the Base64 data to binary
            let binaryData = atob(base64Data);

            // Create an ArrayBuffer with the binary data
            let arrayBuffer = new ArrayBuffer(binaryData.length);
            let view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < binaryData.length; i++) {
                view[i] = binaryData.charCodeAt(i);
            }

            // Create a Blob with the ArrayBuffer
            let blob = new Blob([arrayBuffer], { type: imageType });

            // Create an object URL for the Blob
            let objectUrl = URL.createObjectURL(blob);

            if (image != "") {
                img.src = objectUrl;

            } else {
                img.src = "profile.jpg"
            }
        })
        .catch(error => console.error('Error:', error));

    // getImage


    clone = img
    var top = childTop + 12 + "px";

    $(clone).css({ 'top': top }).addClass("floatingImg").appendTo("#chatbox");

    setTimeout(function () { $("#profile p").addClass("animate"); $("#profile").addClass("animate"); }, 100);
    setTimeout(function () {
        $("#chat-messages").addClass("animate");
        $('.cx, .cy').addClass('s1');
        setTimeout(function () { $('.cx, .cy').addClass('s2'); }, 100);
        setTimeout(function () { $('.cx, .cy').addClass('s3'); }, 200);
    }, 150);

    $('.floatingImg').animate({
        'width': "24%",
        'height': "13%",
        'left': '108px',
        'top': '20px'
    }, 200);



    selectedUser = sessionStorage.getItem("user_name").slice(1, -1)
    var name = sessionStorage.getItem("first_name").slice(1, -1) + " " + sessionStorage.getItem("last_name").slice(1, -1);

    var email = sessionStorage.getItem("mail").slice(1, -1)


    $("#profile p").html(name);
    $("#profile span").html(email + '<div>' + sessionStorage.getItem("user_name") + '</div>');

    $(".message").not(".right").find("img").attr("src", $(clone).attr("src"));
    $('#friendslist').fadeOut();
    $('#chatview').fadeIn();


    $('#close').unbind("click").click(function () {
        $("#chat-messages, #profile, #profile p").removeClass("animate");
        $('.cx, .cy').removeClass("s1 s2 s3");
        $('.floatingImg').animate({
            'width': "40px",
            'top': top,
            'left': '12px'
        }, 200, function () { $('.floatingImg').remove() });

        setTimeout(function () {
            $('#chatview').fadeOut();
            $('#friendslist').fadeIn();
        }, 50);
    });

    $("#profileImg").click(function () {
        var input = document.createElement("input");
        input.type = "file";
        input.id = "file-input";
        input.name = "file-input";
        input.style.display = "none";

        input.addEventListener("change", function () {
            var file = this.files[0];
            let reader = new FileReader();

            // Read the contents of the selected file as a data URL
            reader.readAsDataURL(file);

            // Add an event listener for when the file is done being read
            var dataUrl = ""
            reader.onloadend = function () {
                // Get the file's data as a data URL
                dataUrl = reader.result;
                fetch("http://" + serverAddress + ":" + port.toString() + "/setImage/" + getConnectedUserName(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataUrl)
                })
                    .then(response => response.json())
                    .then((data) => {

                        // getImage
                        var image = "profile.jpg"
                        fetch("http://" + serverAddress + ":" + port.toString() + "/getImage/" + getConnectedUserName(), {
                            method: 'GET'
                        })
                            .then(response => response.json())
                            .then((data) => {
                                image = data

                                let imageType = image.substring(0, image.indexOf(";base64,") + 8);
                                let base64Data = image.substring(image.indexOf(";base64,") + 8);
                                let binaryData = atob(base64Data);
                                let arrayBuffer = new ArrayBuffer(binaryData.length);
                                let view = new Uint8Array(arrayBuffer);
                                for (let i = 0; i < binaryData.length; i++) {
                                    view[i] = binaryData.charCodeAt(i);
                                }
                                let blob = new Blob([arrayBuffer], { type: imageType });
                                let objectUrl = URL.createObjectURL(blob);
                                img.src = objectUrl;
                            })
                            .catch(error => console.error('Error:', error));

                        // getImage


                    })
                    .catch(error => console.error('Error:', error));

            }


        });

        input.click();
    });

}

$(document).ready(function () {

    var preloadbg = document.createElement("img");
    preloadbg.src = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/245657/timeline1.png";

    $("#searchfield").focus(function () {
        if ($(this).val() == "Search contacts...") {
            $(this).val("");
        }
    });
    $("#searchfield").focusout(function () {
        if ($(this).val() == "") {
            $(this).val("Search contacts...");

        }
    });

    $("#sendmessage input").focus(function () {
        if ($(this).val() == "Send message...") {
            $(this).val("");
        }
    });
    $("#sendmessage input").focusout(function () {
        if ($(this).val() == "") {
            $(this).val("Send message...");

        }
    });

    $("#profileLogo").click(callbackProfile);


    // $(".friend").click(callbackFriends);

});



fetch("http://" + serverAddress + ":" + port.toString() + "/users", {
    method: 'GET'
})
    .then(response => response.json())
    .then((data) => {
        added = 0
        globalUsers = data;
        html = ""
        i = 0
        for (let user of data) {


            if (!i) {
                html += '<div id="chatroomButton" class="Chatroom_button"><span>ChatRoom 📭</span></div>'

            }
            i++

            // getImage
            var image = "profile.jpg"
            fetch("http://" + serverAddress + ":" + port.toString() + "/getImage/" + user["user_name"], {
                method: 'GET'
            })
                .then(response => response.json())
                .then((data) => {
                    image = data
                    if (image != "") {

                        let imageType = image.substring(0, image.indexOf(";base64,") + 8);

                        // Get the Base64 data part
                        let base64Data = image.substring(image.indexOf(";base64,") + 8);

                        // Use the atob function to decode the Base64 data to binary
                        let binaryData = atob(base64Data);

                        // Create an ArrayBuffer with the binary data
                        let arrayBuffer = new ArrayBuffer(binaryData.length);
                        let view = new Uint8Array(arrayBuffer);
                        for (let i = 0; i < binaryData.length; i++) {
                            view[i] = binaryData.charCodeAt(i);
                        }

                        // Create a Blob with the ArrayBuffer
                        let blob = new Blob([arrayBuffer], { type: imageType });

                        // Create an object URL for the Blob
                        let objectUrl = URL.createObjectURL(blob);


                        image = objectUrl;
                        sessionStorage.setItem(user["user_name"], image);
                        if (user["user_name"] != getConnectedUserName()) {
                            html += '<div class="friend" id="' + user["user_name"] + '"><img src=' + image + '><p><strong>' + user["first_name"] + ' ' + user["last_name"] + '</strong></br><span>' + user["mail"] + '</span></p><div class="status available"></div></div>'
                            added++
                            if (added == globalUsers.length - 1) {
                                html += '<div style="height:30%;width:100%" ></div>'
                            }
                            document.getElementById("friends").innerHTML = html
                            $("#chatroomButton").click(() => {
                                chatRoomButtonFunc()
                            })
                            $(".friend").click(callbackFriends);

                        }



                    } else {
                        if (user["user_name"] != getConnectedUserName()) {

                            sessionStorage.setItem(user["user_name"], "profile.jpg");
                            html += '<div class="friend" id="' + user["user_name"] + '"><img src="profile.jpg"><p><strong>' + user["first_name"] + ' ' + user["last_name"] + '</strong></br><span>' + user["mail"] + '</span></p><div class="status available"></div></div>'
                            added++
                            if (added == globalUsers.length - 1) {
                                html += '<div style="height:30%;width:100%" ></div>'
                            }
                            document.getElementById("friends").innerHTML = html
                            $("#chatroomButton").click(() => {
                                chatRoomButtonFunc()
                            })
                            $(".friend").click(callbackFriends);
                        }
                    }


                })
                .catch(error => {
                    console.error('Error:', error)
                    sessionStorage.setItem(user["user_name"], "profile.jpg");
                    if (user["user_name"] != getConnectedUserName()) {

                        html += '<div class="friend" id="' + user["user_name"] + '"><img src="profile.jpg"><p><strong>' + user["first_name"] + ' ' + user["last_name"] + '</strong></br><span>' + user["mail"] + '</span></p><div class="status available"></div></div>'
                        added++
                        if (added == globalUsers.length - 2) {
                            html += '<div style="height:30%;width:100%" ></div>'
                        }
                        document.getElementById("friends").innerHTML = html
                        $(".friend").click(callbackFriends);
                    }
                });



        }


        // innerHTML='<div class="friend"><img src="profile.jpg"><p><strong>Miro Badev</strong></br><span>mirobadev@gmail.com</span></p><div class="status available"></div></div>'
        // '<div class="friend"><img src="profile.jpg"><p><strong>Miro Badev</strong></br><span>mirobadev@gmail.com</span></p><div class="status available"></div></div>'
    })
    .catch(error => console.error(error))


setInterval(() => {
    fetch("http://" + serverAddress + ":" + port.toString() + "/connected", {
        method: 'GET'
    })
        .then(response => response.json())
        .then((data) => {
            for (let user of globalUsers) {
                if (user["user_name"] == getConnectedUserName()) {
                    continue
                }

                if (data.indexOf(user["user_name"]) >= 0) {
                    document.getElementById(user["user_name"]).getElementsByTagName("div")[0].className = "status available"
                } else {
                    document.getElementById(user["user_name"]).getElementsByTagName("div")[0].className = "status inactive"

                }
            }
            // document.getElementById("friends").innerHTML = html
            // innerHTML='<div class="friend"><img src="profile.jpg"><p><strong>Miro Badev</strong></br><span>mirobadev@gmail.com</span></p><div class="status available"></div></div>'
            // '<div class="friend"><img src="profile.jpg"><p><strong>Miro Badev</strong></br><span>mirobadev@gmail.com</span></p><div class="status available"></div></div>'
        })
        .catch(error => console.error(error))
}, 1000);

messageLoop = setInterval(() => {
    if (selectedUser != "") {
        fetch("http://" + serverAddress + ":" + port.toString() + "/messages/" + selectedUser, {
            method: 'GET'
        })
            .then(response => response.json())
            .then((data) => {
                he = data
            })
            .catch(error => console.error(error))

        fetch("http://" + serverAddress + ":" + port.toString() + "/messages/" + getConnectedUserName(), {
            method: 'GET'
        })
            .then(response => response.json())
            .then((data) => {
                me = data

            })
            .catch(error => console.error(error))


        mixed = []



        for (let msg in he) {
            if (he[msg]["sender"] == getConnectedUserName() || selectedUser == "chatroom") {
                mixed.push([msg, he[msg]])
            }
        }
        for (let msg in me) {
            if (me[msg]["sender"] == selectedUser && selectedUser != "chatroom") {
                mixed.push([msg, me[msg]])
            }

        }
        html = ''
        dd = mixed
        mixed.sort(function (a, b) {
            return getNSeconds(a[0]) - getNSeconds(b[0]);
        });
        cc = mixed

        prevDay = ""
        for (let msg in mixed) {
            emoji = "🔑 ✅"
            className = "message"
            color = "#f0f4f7"
            corner = "corner"
            textColor = "#8495a3"
            message = mixed[msg][1]
            image = ""
            if (sessionStorage.getItem(message["sender"]) != null) {
                image = sessionStorage.getItem(message["sender"])
            } else {
                image = "profile.jpg"
            }
            time = mixed[msg][0].match(/\d{2}:\d{2}/)[0]

            if (message["sender"] == getConnectedUserName()) {
                className = "message right"
                color = "deepskyblue"
                corner = ""
                textColor = "white"
            }

            day = mixed[msg][0].match(/\d{2}-\d{2}-\d{2}/)[0]
            if (day != prevDay) {
                html += '<label>' + day + '</label>'
                prevDay = day
            }
            if (message["hacked"] == "yes") {
                emoji = " ⛔ 🚫"
            }
            senderName = ""
            if (selectedUser == "chatroom") {
                senderName = ' ' + message["sender"]
            }
            html += '<div class="' + className + '"><img src="' + image + '"/><div class="bubble" style="background:' + color + '; color:' + textColor + '">' + message["message"] + '<div class="' + corner + '"></div><span>' + time + emoji + senderName + ' </span></div></div>'
        }
        html += '<div  style="height:25%"></div>'
        document.getElementById("chat-messages").innerHTML = html

    }
}, 500);

$("#send").click((event) => {

    send()
})

$("#text").keyup((event) => {

    if (event.key == "Enter") {
        send()
    }
})

$("#sign_out").click(() => {
    sessionStorage.removeItem("user_name");
    sessionStorage.removeItem("first_name");
    sessionStorage.removeItem("last_name");
    sessionStorage.removeItem("mail");

    window.location = "login.html"

})










function chatRoomButtonFunc() {
    friendd = $(".friend")[0]
    var childTop = friendd.offsetTop
    var clone = friendd.getElementsByTagName('img')[0].cloneNode();
    var img = new Image();

    img.id = "profileImg"

    img.src = "favicon.png"

    clone = img
    var top = childTop + 12 + "px";

    $(clone).css({ 'top': top }).addClass("floatingImg").appendTo("#chatbox");

    setTimeout(function () { $("#profile p").addClass("animate"); $("#profile").addClass("animate"); }, 100);
    setTimeout(function () {
        $("#chat-messages").addClass("animate");
        $('.cx, .cy').addClass('s1');
        setTimeout(function () { $('.cx, .cy').addClass('s2'); }, 100);
        setTimeout(function () { $('.cx, .cy').addClass('s3'); }, 200);
    }, 150);

    $('.floatingImg').animate({
        'width': "24%",
        'height': "13%",
        'left': '108px',
        'top': '20px'
    }, 200);



    selectedUser = "chatroom"

    $("#profile p").html("INSAT Chatroom");
    $("#profile span").html('Welcome in the family');

    $(".message").not(".right").find("img").attr("src", $(clone).attr("src"));
    $('#friendslist').fadeOut();
    $('#chatview').fadeIn();


    $('#close').unbind("click").click(function () {
        $("#chat-messages, #profile, #profile p").removeClass("animate");
        $('.cx, .cy').removeClass("s1 s2 s3");
        $('.floatingImg').animate({
            'width': "40px",
            'top': top,
            'left': '12px'
        }, 200, function () { $('.floatingImg').remove() });

        setTimeout(function () {
            $('#chatview').fadeOut();
            $('#friendslist').fadeIn();
        }, 50);
    });


}
