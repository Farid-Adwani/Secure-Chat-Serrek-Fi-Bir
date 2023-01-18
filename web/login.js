
serverAddress = "127.0.0.1"
port = 5000

function wrongCredentials() {
    in1 = document.getElementById("user_name")
    in1.value = ""
    in1.style.border = "1px solid red"
    in2 = document.getElementById("password")
    in2.value = ""
    in2.style.border = "1px solid red"

}

function wrongCredential(id) {
    in1 = document.getElementById(id)
    in1.value = ""
    in1.style.border = "1px solid red"

}

function authenticate(user_name, password) {
    if (password != "" && user_name.indexOf(" ") == -1) {
        fetch('http://localhost:5000' + '/login/' + user_name + '/' + password, {
            method: 'GET',

        })
            .then(response => response.json())
            .then((data) => {
                if (Object.keys(data).length === 0) {
                    wrongCredentials()
                } else {
                    sessionStorage.setItem("user_name", JSON.stringify(data["user_name"]));
                    sessionStorage.setItem("first_name", JSON.stringify(data["first_name"]));
                    sessionStorage.setItem("last_name", JSON.stringify(data["last_name"]));
                    sessionStorage.setItem("mail", JSON.stringify(data["mail"]));


                    fetch("http://" + serverAddress + ":" + port.toString() + "/port/" + sessionStorage.getItem("user_name").slice(1, -1), {
                        method: 'GET'
                    })
                        .then(response => response.json())
                        .then((data) => {
                            if (data == "-1") {
                                // run script
                                fetch("http://" + serverAddress + ":" + port.toString() + "/run/" + sessionStorage.getItem("user_name").slice(1, -1), {
                                    method: 'GET'
                                })
                                    .then(response => response.json())
                                    .then((data) => {
                                        // window.location = "index.html"



                                    })
                                    .catch(error => console.error('Error:', error));



                            } else {
                            }
                            window.location = "index.html"


                        })
                        .catch(error => console.error('Error:', error));

                }


            })
            .catch(error => console.error('Error:', error));


    } else {
        wrongCredentials()
    }
}

if (sessionStorage.getItem("user_name") !== null) {
    window.location = "index.html"
}


$("#login").click((event) => {
    user_name = document.getElementById("user_name").value
    password = document.getElementById("password").value
    authenticate(user_name, password)



    // window.location = "index.html"
})

$("#register").click((event) => {
    user_name = document.getElementById("register_user_name").value
    password = document.getElementById("register_password").value
    first_name = document.getElementById("first_name").value
    last_name = document.getElementById("last_name").value
    mail = document.getElementById("mail").value
    if (password != "" && user_name.indexOf(" ") == -1 && user_name != "" && first_name != "" && last_name != "" && mail != "") {
        fetch('http://localhost:5000' + '/register/' + first_name + '/' + last_name + '/' + mail + '/' + user_name + '/' + password, {
            method: 'GET',

        })
            .then(response => response.json())
            .then((data) => {
                authenticate(user_name, password)
            })
            .catch(error => console.error('Error:', error));
    }
    else if (first_name == "") {
        wrongCredential("first_name")
    } else if (last_name == "") {
        wrongCredential("last_name")
    }

    else if (user_name == "" || user_name.indexOf(" ") != -1) {

        wrongCredential("register_user_name")
    }
    else if (mail == "") {
        wrongCredential("mail")
    }

    else if (password == "") {
        wrongCredential("register_password")
    }




    // window.location = "index.html"
})


$("input").change((e) => {
    e.target.style.border = "none"
})