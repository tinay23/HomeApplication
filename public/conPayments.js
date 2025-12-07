document.addEventListener("DOMContentLoaded", loadContractorPayments);

async function loadContractorPayments() {
    const contractor_id = localStorage.getItem("user_id");

    const res = await fetch(`/contractor_get_invoices?contractor_id=${contractor_id}`, {
        cache: "no-store"
    });
    const data = await res.json();

    if (!data.ok) {
        document.getElementById("invoiceList").innerHTML = "<p>Error loading invoices.</p>";
        return;
    }

    const invoices = data.invoices;

    console.log("Loaded invoices:", invoices);

    renderSummary(invoices);
    renderPaymentList(invoices);
    renderCharts(invoices);
}

/* ---------------------------
   SUMMARY (FIXED)
---------------------------- */
function renderSummary(invoices) {
    let total = 0;
    let pending = 0;

    invoices.forEach(inv => {
        const amt = Number(inv.amount);
        if (inv.status === "paid") total += amt;
        if (inv.status === "unpaid") pending += amt;
    });

    document.getElementById("totalEarned").textContent = `$${total.toFixed(2)}`;
    document.getElementById("pendingAmount").textContent = `$${pending.toFixed(2)}`;
}

/* ---------------------------
   PAYMENT LIST
---------------------------- */
function renderPaymentList(invoices) {
    const box = document.getElementById("invoiceList");
    box.innerHTML = "";

    invoices.forEach(inv => {
        const div = document.createElement("div");
        div.className = "invoice-card";

        div.innerHTML = `
            <h3>Job #${inv.job_id} — ${inv.service_type}</h3>
            <p><strong>Amount:</strong> $${inv.amount}</p>
            <p><strong>Status:</strong> ${inv.status.toUpperCase()}</p>
            <p><strong>Homeowner:</strong> ${inv.homeowner_name}</p>
            <p><strong>Date:</strong> ${new Date(inv.created_at).toLocaleDateString()}</p>
        `;

        box.appendChild(div);
    });
}

/* ---------------------------
   FIXED CHART FUNCTION
---------------------------- */
function renderCharts(invoices) {
    const paidInvoices = invoices.filter(i => i.status === "paid");

    // Group earnings by date (YYYY-MM-DD)
    const earningsByDay = {};

    paidInvoices.forEach(inv => {
        const d = new Date(inv.paid_at);
        const key = d.toISOString().split("T")[0];  // yyyy-mm-dd

        if (!earningsByDay[key]) earningsByDay[key] = 0;
        earningsByDay[key] += Number(inv.amount);
    });

    // Convert grouped data into sorted arrays
    const sortedDates = Object.keys(earningsByDay).sort();
    const labels = sortedDates.map(date => {
        return new Date(date).toLocaleDateString();
    });

    const amounts = sortedDates.map(date => earningsByDay[date]);

    // Draw chart
    new Chart(document.getElementById("earningsChart"), {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Earnings Over Time",
                data: amounts,
                borderColor: "#0077cc",
                backgroundColor: "rgba(0, 119, 204, 0.2)",
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            }
        }
    });
}
