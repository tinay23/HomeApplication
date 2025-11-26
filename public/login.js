document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("conloginBtn").addEventListener("click", () => login("contractor"));
    document.getElementById("homeloginBtn").addEventListener("click", () => login("homeowner"));
    document.getElementById("adminloginBtn").addEventListener("click", () => login("admin"));
});

function login(role) {
    let email = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value;
    let msg = document.getElementById("message");

    if (!email || !password) {
        msg.textContent = "Please enter both username and password.";
        msg.style.color = "red";
        return;
    }

    // LOGIN USING POST REQUEST
    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(res => res.json())
    .then(data => {

        if (!data.ok) {
            msg.textContent = data.error || "Invalid login.";
            msg.style.color = "red";
            return;
        }

        // ✅ SAVE USER ID + ROLE FOR FUTURE PAGES
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("role", data.role);
	localStorage.setItem("full_name", data.full_name);
	localStorage.setItem("first_name", data.full_name.split(" ")[0]);

        msg.textContent = "Login successful!";
        msg.style.color = "green";

        // Give small delay, then redirect
        setTimeout(() => {
            window.location.href = data.redirect;
        }, 500);
    })
    .catch(err => {
        console.error("Network error:", err);
        msg.textContent = "Network error.";
        msg.style.color = "red";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault(); 

            // Click homeowner login by default, OR whichever you prefer
            document.getElementById("conloginBtn").click();
        }
    });
});
