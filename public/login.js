document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("conloginBtn").addEventListener("click", () => login("contractor"));
  document.getElementById("homeloginBtn").addEventListener("click", () => login("homeowner"));
  document.getElementById("adminloginBtn").addEventListener("click", () => login("admin"));
});

async function login(role) {
  const userInput = document.getElementById("username");
  const passInput = document.getElementById("password");
  const msg = document.getElementById("message");

  const username = userInput.value.trim();
  const password = passInput.value;

  if (!username || !password) {
    msg.style.color = "red";
    msg.textContent = "Please enter both username and password.";
    return;
  }

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: role,
	username: username,
        password: password,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || !data.ok) {
      msg.style.color = "red";
      msg.textContent = (data && data.error) || "Invalid username or password.";
      return;
    }

    msg.style.color = "green";
    msg.textContent = "Login successful.";
    const redirectTarget = data.redirect || (
      role === "contractor"
        ? "/conDashboard.html"
        : role === "homeowner"
        ? "/homeDashboard.html"
        : "/adminDashboard.html"
    );

    setTimeout(() => {
      window.location.href = redirectTarget;
    }, 400);
  } catch (err) {
    console.error(err);
    msg.style.color = "red";
    msg.textContent = "Error contacting server.";
  }
}
