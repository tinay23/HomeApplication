document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("jobForm");
    const msg = document.getElementById("message");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const user_id = localStorage.getItem("user_id");
        const role = localStorage.getItem("role");

        // SECURITY CHECK
        if (!user_id || role !== "homeowner") {
            msg.style.color = "red";
            msg.textContent = "You must be logged in as a homeowner.";
            return;
        }

        const service_type = document.getElementById("service_type").value.trim();
        const description = document.getElementById("description").value.trim();
        const budget = document.getElementById("budget").value.trim();

        if (!service_type || !description || !budget) {
            msg.style.color = "red";
            msg.textContent = "Please fill out all fields.";
            return;
        }

        try {
            const response = await fetch("/create_job", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    homeowner_id: user_id,
                    service_type,
                    description,
                    budget
                })
            });

            const data = await response.json();

            if (!data.ok) {
                msg.style.color = "red";
                msg.textContent = data.error || "Failed to create job.";
                return;
            }

            msg.style.color = "green";
            msg.textContent = "Job posted successfully! Redirecting…";

            setTimeout(() => {
                window.location.href = "/homeDashboard.html";
            }, 800);

        } catch (error) {
            console.error("Network error:", error);
            msg.style.color = "red";
            msg.textContent = "Network error posting job.";
        }
    });
});
