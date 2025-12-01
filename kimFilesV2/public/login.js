document.addEventListener("DOMContentLoaded", () => {
	//get btn clicks, run login based on btn
	document.getElementById("conloginBtn").addEventListener("click", () => login("contractor"));
	document.getElementById("homeloginBtn").addEventListener("click", () => login("homeowner"));
	document.getElementById("adminloginBtn").addEventListener("click", () => login("admin"));

});

function login(role) {
  //assign textbox info
	let user = document.getElementById("username").value.trim();
	let pass = document.getElementById("password").value;
	let msg = document.getElementById("message");

	//error if missing info
	if (!user || !pass) {
		msg.textContent = "Please enter both username and password.";
	return;
	}

	//set url to be type of user/name/pass
	let url =
		`/login?role=${encodeURIComponent(role)}` +
		`&username=${encodeURIComponent(user)}` +
		`&password=${encodeURIComponent(pass)}`;
	
	//xmlhttp
	let xmlhttp = new XMLHttpRequest();

	xmlhttp.onload = loadResults;
	xmlhttp.onerror = loadError;

	xmlhttp.open("GET", url, true);
	xmlhttp.send();

	function loadResults() {
    //taking server response 
    let text = xmlhttp.responseText || "";
	//possible get data from database
    let data = null;
    try {
		data = JSON.parse(text);
    } catch (_) {
      // catch
    }

	//always assuming false until true
    let success = false;
    let redirectTarget = null;
    let serverMsg = "";

	//unsure if this will work 
    if (data && typeof data === "object") {
      success = !!data.success;
      serverMsg = data.message || "";
      redirectTarget = data.redirect || null;
    } else {
      //if server returns text
      let txt = text.trim().toUpperCase();
	  //if the message is positive set success true
      if (txt === "OK" || txt === "SUCCESS" || txt === "TRUE") {
        success = true;
		//if redirect then set redirect
      } else if (txt.startsWith("REDIRECT ")) {
        success = true;
        redirectTarget = txt.substring("REDIRECT ".length).trim();
      } else {
        // only other option is failure
        serverMsg = text.trim();
      }
    }

	//for testing 
    if (success) {
      msg.style.color = "green";
      msg.textContent = serverMsg || "Login successful(server).";

      //just in case 
      if (!redirectTarget) {
        redirectTarget =
          role === "contractor"
            ? "conDashboard.html"
            : role === "homeowner"
            ? "homeDashboard.html"
            : "adminDashboard.html";
      }

      //adding pause for testing
      setTimeout(() => (window.location.href = redirectTarget), 500);
      return;
    }

    //testing off server
    const testUsers = {
      contractor: { user: "contractor1", pass: "password123", redirect: "conDashboard.html" },
      homeowner: { user: "homeowner1", pass: "password123", redirect: "homeDashboard.html" },
      admin: { user: "admin1", pass: "password123", redirect: "adminDashboard.html" },
    };

    const test = testUsers[role];
    if (test && user === test.user && pass === test.pass) {
      msg.style.color = "green";
      msg.textContent = "Login successful (hardcode).";
      setTimeout(() => (window.location.href = test.redirect), 500);
    } else {
      msg.style.color = "red";
      msg.textContent = serverMsg || "Invalid username or password.";
    }
  }

  function loadError() {
    // Network error → fall back to mock credentials (still gives demo behavior)
    const msg = document.getElementById("message");
    const testUsers = {
      contractor: { user: "contractor1", pass: "password123", redirect: "conDashboard.html" },
      homeowner: { user: "homeowner1", pass: "password123", redirect: "homeDashboard.html" },
      admin: { user: "admin1", pass: "password123", redirect: "adminDashboard.html" },
    };

    const test = testUsers[role];
    if (test && document.getElementById("username").value.trim() === test.user && document.getElementById("password").value === test.pass) {
      msg.style.color = "green";
      msg.textContent = "Login successful (error).";
      setTimeout(() => (window.location.href = test.redirect), 500);
    } else {
      msg.style.color = "red";
      msg.textContent = "Request failed.";
    }
  }
}
