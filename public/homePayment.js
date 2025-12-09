document.addEventListener("DOMContentLoaded", () => {
    checkCardStatus();
    loadInvoices();
});

function openCardModal() {
    document.getElementById("cardModal").classList.remove("hidden");
}

function closeCardModal() {
    document.getElementById("cardModal").classList.add("hidden");
}

function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, "");
    value = value.substring(0, 16);
    input.value = value.replace(/(.{4})/g, "$1 ").trim();
    updateCardPreview();
}

function updateCardPreview() {
    const num = document.getElementById("cardNumber").value || "";
    const name = document.getElementById("cardName").value || "";
    const mm = document.getElementById("expMonth").value || "";
    const yy = document.getElementById("expYear").value || "";

    document.getElementById("previewNumber").textContent = num || "**** **** **** ****";
    document.getElementById("previewName").textContent = name.toUpperCase() || "CARDHOLDER NAME";
    document.getElementById("previewExpiry").textContent = mm && yy ? `${mm}/${yy}` : "MM/YY";
}

function saveCard() {
    const number = document.getElementById("cardNumber").value.trim();
    const name = document.getElementById("cardName").value.trim();
    const month = document.getElementById("expMonth").value;
    const year = document.getElementById("expYear").value;
    const cvv = document.getElementById("cvv").value.trim();

    if (number.length < 19) return alert("Please enter a valid 16-digit card number.");
    if (!name) return alert("Please enter the cardholder name.");
    if (!month || !year) return alert("Please select an expiration date.");
    if (cvv.length < 3) return alert("Invalid CVV.");

    const cardData = { number, name, exp: `${month}/${year}`, cvv };

    const userId = localStorage.getItem("user_id");
    localStorage.setItem(`home_cc_${userId}`, JSON.stringify(cardData));

    alert("✅ Credit card added!");
    closeCardModal();
    checkCardStatus();
    loadInvoices();
}

async function loadInvoices() {
    const homeowner_id = localStorage.getItem("user_id");
    const userId = localStorage.getItem("user_id");
    const hasCard = localStorage.getItem(`home_cc_${userId}`);

    const res = await fetch(`/get_homeowner_invoices?homeowner_id=${homeowner_id}`);
    const data = await res.json();

    const box = document.getElementById("invoiceList");
    box.innerHTML = "";

    if (!data.ok || data.invoices.length === 0) {
        box.innerHTML = "<p>No invoices found.</p>";
        return;
    }

    data.invoices.forEach(inv => {
        const div = document.createElement("div");
        div.className = "invoice-card";

        div.innerHTML = `
            <h3>Job #${inv.job_id} — ${inv.service_type}</h3>
            <p><strong>Contractor:</strong> ${inv.contractor_name}</p>
            <p><strong>Amount:</strong> $${inv.amount}</p>
            <p><strong>Status:</strong>
                <span class="${inv.status === 'paid' ? 'status-paid' : 'status-unpaid'}">
                    ${inv.status.toUpperCase()}
                </span>
            </p>
        `;

        if (inv.status === "unpaid") {
            const btn = document.createElement("button");
            btn.className = "btn-pay";
            btn.textContent = hasCard ? "Pay Invoice" : "Add Credit Card First";

            if (!hasCard) {
                btn.style.background = "#aaa";
                btn.style.cursor = "not-allowed";
                btn.onclick = () => openCardModal();
            } else {
                btn.onclick = () => payInvoice(inv.invoice_id);
            }

            div.appendChild(btn);
        }

        box.appendChild(div);
    });
}

async function payInvoice(invoice_id) {
    const homeowner_id = localStorage.getItem("user_id");
    const userId = localStorage.getItem("user_id");

    if (!localStorage.getItem(`home_cc_${userId}`)) {
        alert("You must add a credit card before paying.");
        return;
    }

    document.getElementById("processingOverlay").style.display = "flex";

    setTimeout(async () => {
        const res = await fetch("/pay_invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invoice_id, homeowner_id })
        });

        const data = await res.json();
        document.getElementById("processingOverlay").style.display = "none";

        if (data.ok) {
            alert("✅ Payment successful!");
            loadInvoices();
        } else {
            alert("❌ Payment failed.");
        }
    }, 2200);
}

function checkCardStatus() {
    const cardBox = document.getElementById("cardStatus");
    const removeBtn = document.getElementById("removeCardBtn");
    const userId = localStorage.getItem("user_id");
    const card = localStorage.getItem(`home_cc_${userId}`);

    if (!card) {
        cardBox.innerHTML = "💳 No card on file";
        removeBtn.style.display = "none";
        return;
    }

    const data = JSON.parse(card);
    const last4 = data.number.replace(/\s/g, "").slice(-4);
    const brand = detectCardBrand(data.number.replace(/\s/g, ""));

    cardBox.innerHTML = `💳 ${brand} ending in <strong>${last4}</strong>`;
    removeBtn.style.display = "inline-block";
}

function removeCard() {
    if (!confirm("Are you sure you want to remove your saved card?")) return;
    const userId = localStorage.getItem("user_id");
    localStorage.removeItem(`home_cc_${userId}`);
    alert("Card removed successfully.");
    checkCardStatus();
    loadInvoices();
}

function detectCardBrand(number) {
    if (/^4/.test(number)) return "Visa";
    if (/^5[1-5]/.test(number)) return "Mastercard";
    if (/^3[47]/.test(number)) return "American Express";
    if (/^6/.test(number)) return "Discover";
    return "Card";
}
