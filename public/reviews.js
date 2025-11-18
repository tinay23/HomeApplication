async function loadReviews() {
    const wrapper = document.getElementById("reviewsWrapper");

    const res = await fetch("/get_reviews");
    const data = await res.json();

    if (!data.ok) {
        wrapper.innerHTML = "<p>Failed to load reviews.</p>";
        return;
    }

    wrapper.innerHTML = data.reviews.map(r => `
        <div class="swiper-slide">
            <div class="testimonial-card">
                <img src="${r.profile_image || 'default_user.png'}" alt="Profile">
                <p class="quote">“${r.review_text}”</p>
                <h3 class="name">${r.reviewer_name}</h3>
            </div>
        </div>
    `).join("");

    // ⭐ IMPORTANT: Destroy old Swiper instance before creating a new one
    if (window.reviewSwiper) {
        window.reviewSwiper.destroy(true, true);
    }

    // ⭐ Now reinitialize AFTER slides exist
    window.reviewSwiper = new Swiper(".mySwiper", {
        slidesPerView: 3,
        spaceBetween: 30,
        loop: true,
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        }
    });
}

loadReviews();
