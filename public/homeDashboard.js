if (!localStorage.getItem("user_id")) {
    window.location.replace = "/login.html"; // block access
}

document.addEventListener("DOMContentLoaded", loadJobs);
document.addEventListener("DOMContentLoaded", () => {
    const fullName = localStorage.getItem("full_name") || "Homeowner";
    const firstName = fullName.split(" ")[0]; // get first name only

    document.getElementById("welcomeTitle").textContent = `Welcome, ${firstName}!`;
});

async function loadJobs() {
    const container = document.getElementById("jobContainer");
    const user_id = localStorage.getItem("user_id");
    const role = localStorage.getItem("role");

    // SECURITY CHECK
    if (!user_id || role !== "homeowner") {
        container.innerHTML = "<p style='color:red;'>You must be logged in as a homeowner.</p>";
        return;
    }

    try {
        const res = await fetch(`/get_jobs?homeowner_id=${user_id}`);
        const data = await res.json();

        if (!data.ok) {
            container.innerHTML = "<p style='color:red;'>Failed to load jobs.</p>";
            return;
        }

        const jobs = data.jobs;

        // If homeowner has no jobs
        if (!jobs || jobs.length === 0) {
            container.innerHTML = "<p>You haven’t posted any jobs yet.</p>";
            return;
        }

        // Clear container
        container.innerHTML = "";

        // Build job cards
        jobs.forEach(job => {
            const card = document.createElement("div");
            card.classList.add("card");

            card.innerHTML = `
                <h3>${job.service_type}</h3>
                <small>Status: ${job.status} • Budget: $${job.budget}</small>
                <p>${job.description}</p>
                <small>Posted: ${new Date(job.created_at).toLocaleDateString()}</small>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Fetch error:", error);
        container.innerHTML = "<p style='color:red;'>Error fetching jobs.</p>";
    }
}

function openReviewForm() {
    document.getElementById("reviewForm").classList.remove("hidden");
}

async function submitReview() {
    const text = document.getElementById("reviewText").value.trim();
    const msg = document.getElementById("reviewMessage");

    if (!text) {
        msg.textContent = "Please enter a review.";
        msg.style.color = "red";
        return;
    }

    const user_id = localStorage.getItem("user_id");
    const full_name = localStorage.getItem("full_name");

    const res = await fetch("/add_review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            homeowner_id: user_id,
            reviewer_name: full_name,
            review_text: text
        })
    });

    const data = await res.json();
    if (data.ok) {
        msg.textContent = "Review submitted!";
        msg.style.color = "green";
        document.getElementById("reviewText").value = "";
    } else {
        msg.textContent = data.error;
        msg.style.color = "red";
    }
}


document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    localStorage.removeItem("full_name");

    // redirect to login
    window.location.href = "/login.html";
});
