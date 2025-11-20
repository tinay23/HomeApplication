// Redirect if not contractor
if (localStorage.getItem("role") !== "contractor") {
    window.location.replace("/login.html");
}

// Show contractor's first name
document.addEventListener("DOMContentLoaded", () => {
    const fullName = localStorage.getItem("full_name") || "";
    const firstName = fullName.split(" ")[0];

    const title = document.getElementById("welcomeTitle");
    if (title) {
        title.textContent = `Welcome, ${firstName}`;
    }
});

const contractor_id = localStorage.getItem("user_id");

// Store available jobs for sorting
let availableJobsCache = [];

document.addEventListener("DOMContentLoaded", () => {
    loadAvailableJobs();
    setupTabs();
    setupSorting();
});

// Setup tabs
function setupTabs() {
    document.getElementById("tab-available").onclick = () => {
        setActive("tab-available");
        loadAvailableJobs();
    };

    document.getElementById("tab-progress").onclick = () => {
        setActive("tab-progress");
        loadInProgressJobs();
    };

    document.getElementById("tab-completed").onclick = () => {
        setActive("tab-completed");
        loadCompletedJobs();
    };
}

function setActive(id) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    const sortContainer = document.getElementById("sortContainer");

    if (id === "tab-available") {
        // Show sorting when on 'Available Jobs'
        sortContainer.style.display = "block";
    } else {
        // Hide sorting for other tabs
        sortContainer.style.display = "none";
    }
}

// -----------------------
// LOAD Available Jobs
// -----------------------
async function loadAvailableJobs() {
    const res = await fetch("/contractor_get_jobs");
    const data = await res.json();
    availableJobsCache = data.jobs;  // store jobs for sorting
    applySorting();                  // apply current sort
}

// -----------------------
async function loadInProgressJobs() {
    const res = await fetch(`/contractor_get_inprogress_jobs?contractor_id=${contractor_id}`);
    const data = await res.json();
    displayJobs(data.jobs, "in_progress");
}

// -----------------------
async function loadCompletedJobs() {
    const res = await fetch(`/contractor_get_completed_jobs?contractor_id=${contractor_id}`);
    const data = await res.json();
    displayJobs(data.jobs, "completed");
}

// -----------------------
// SORTING LOGIC
// -----------------------
function setupSorting() {
    const select = document.getElementById("sortSelect");
    if (select) {
        select.addEventListener("change", applySorting);
    }
}

function applySorting() {
    if (!availableJobsCache || availableJobsCache.length === 0) return;

    const sortValue = document.getElementById("sortSelect").value;
    let sortedJobs = [...availableJobsCache];

    if (sortValue === "budget_low") {
        sortedJobs.sort((a, b) => a.budget - b.budget);
    } else if (sortValue === "budget_high") {
        sortedJobs.sort((a, b) => b.budget - a.budget);
    } else if (sortValue === "service_az") {
        sortedJobs.sort((a, b) => a.service_type.localeCompare(b.service_type));
    } else if (sortValue === "service_za") {
        sortedJobs.sort((a, b) => b.service_type.localeCompare(a.service_type));
    }

    displayJobs(sortedJobs, "available");
}

// -----------------------
// DISPLAY JOB CARDS
// -----------------------
function displayJobs(jobs, type) {
    const container = document.getElementById("contentContainer");
    container.innerHTML = "";

    if (!jobs || jobs.length === 0) {
        container.innerHTML = "<p>No jobs found.</p>";
        return;
    }

    jobs.forEach(job => {
        let card = `
            <div class="job-card">
                <h3>${job.service_type}</h3>
                <p>${job.description}</p>
                <small>Budget: $${job.budget}</small><br>
                <small>Posted: ${new Date(job.created_at).toLocaleDateString()}</small>
        `;

        if (type === "available") {
            card += `<button class="btn-accept" onclick="acceptJob(${job.job_id})">Accept Job</button>`;
        }

        if (type === "in_progress") {
            card += `<button class="btn-complete" onclick="completeJob(${job.job_id})">Mark Completed</button>`;
        }

        if (type === "completed") {
            let completedDate = "Unknown";

            if (job.completed_at && job.completed_at !== "0000-00-00 00:00:00") {
                const d = new Date(job.completed_at);
                completedDate = isNaN(d.getTime()) ? "Unknown" : d.toLocaleDateString();
            }

            card += `<br><small>Completed: ${completedDate}</small>`;
        }

        card += `</div>`;
        container.innerHTML += card;
    });
}

// -----------------------
// ACCEPT JOB
// -----------------------
async function acceptJob(job_id) {
    await fetch("/contractor_accept_job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id, contractor_id })
    });

    loadAvailableJobs();
}

// -----------------------
// COMPLETE JOB
// -----------------------
async function completeJob(job_id) {
    await fetch("/contractor_complete_job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id, contractor_id })
    });

    loadInProgressJobs();
}

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    localStorage.removeItem("full_name");
    window.location.href = "/login.html";
});
