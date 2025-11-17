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
        msg.style.color = "red";
        msg.textContent = "Please enter both email and password.";
        return;
    }

    // Send POST login request to backend
    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(res => {
        if (!res.ok) {
            throw new Error("Server returned error status");
        }
        return res.json();
    })
    .then(data => {
        if (data.ok) {
            msg.style.color = "green";
            msg.textContent = "Login successful! Redirecting...";

            // Redirect from server: /homeDashboard.html, /conDashboard.html, etc.
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 500);
        } else {
            msg.style.color = "red";
            msg.textContent = data.error || "Invalid login.";
        }
    })
    .catch(err => {
        console.error("Network Error:", err);
        msg.style.color = "red";
        msg.textContent = "Email or Password are incorrect";
    });
}
