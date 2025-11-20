document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reviewForm");
    form.classList.add("hidden");
});


if (!localStorage.getItem("user_id")) {
    window.location.replace("/login.html"); // block access
}

document.addEventListener("DOMContentLoaded", loadJobs);
document.addEventListener("DOMContentLoaded", () => {
    const fullName = localStorage.getItem("full_name") || "Homeowner";
    const firstName = fullName.split(" ")[0]; // get first name only

    document.getElementById("welcomeTitle").textContent = `Welcome, ${firstName}!`;
});

async function loadJobs() {
    const openContainer = document.getElementById("openJobsContainer");
    const completedContainer = document.getElementById("completedJobsContainer");

    const user_id = localStorage.getItem("user_id");
    const role = localStorage.getItem("role");

    // SECURITY CHECK
    if (!user_id || role !== "homeowner") {
        openContainer.innerHTML = "<p style='color:red;'>You must be logged in as a homeowner.</p>";
        completedContainer.innerHTML = "";
        return;
    }

    try {
        const res = await fetch(`/get_jobs?homeowner_id=${user_id}`);
        const data = await res.json();

        if (!data.ok) {
            openContainer.innerHTML = "<p style='color:red;'>Failed to load jobs.</p>";
            completedContainer.innerHTML = "";
            return;
        }

        const jobs = data.jobs;

        // Split jobs by status
        const openJobs = jobs.filter(j => j.status !== "completed");
        const completedJobs = jobs.filter(j => j.status === "completed");

        // --- OPEN JOBS SECTION ---
        if (openJobs.length === 0) {
            openContainer.innerHTML = "<p>You have no open jobs.</p>";
        } else {
            openContainer.innerHTML = "";
            openJobs.forEach(job => {
                const card = document.createElement("div");
                card.classList.add("card");

                card.innerHTML = `
                    <h3>${job.service_type}</h3>
                    <small>Status: ${job.status} • Budget: $${job.budget}</small>
                    <p>${job.description}</p>
                    <small>Posted: ${new Date(job.created_at).toLocaleDateString()}</small>
                `;

                openContainer.appendChild(card);
            });
        }

        // --- COMPLETED JOBS SECTION ---
        if (completedJobs.length === 0) {
            completedContainer.innerHTML = "<p>You have no completed jobs.</p>";
        } else {
            completedContainer.innerHTML = "";
            completedJobs.forEach(job => {
                const card = document.createElement("div");
                card.classList.add("card");

                card.innerHTML = `
                    <h3>${job.service_type}</h3>
                    <small>Status: Completed • Budget: $${job.budget}</small>
                    <p>${job.description}</p>
                    <small>Completed: ${
                        job.completed_at 
                            ? new Date(job.completed_at).toLocaleDateString()
                            : "Unknown"
                    }</small>
                `;

                completedContainer.appendChild(card);
            });
        }

    } catch (error) {
        console.error("Fetch error:", error);
        openContainer.innerHTML = "<p style='color:red;'>Error fetching jobs.</p>";
        completedContainer.innerHTML = "";
    }
}


function openReviewForm() {
    document.getElementById("reviewForm").classList.remove("hidden");
}

function cancelReview() {
    const form = document.getElementById("reviewForm");
    form.classList.add("hidden");
    document.getElementById("reviewText").value = "";
    document.getElementById("reviewMessage").textContent = "";
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
