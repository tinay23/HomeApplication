// Attach Respond button to each feedback
document.querySelectorAll('.respond-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const li = btn.closest('.feedback-item');
    const feedbackId = li.getAttribute('data-feedback-id');
    const responseDiv = li.querySelector('.feedback-response');

	//pop up for feedback response
    const text = prompt('Type your response to this feedback:');
    if (!text) return;

	//show response in div text
    responseDiv.textContent = 'Your response: ' + text;

    /* possible database code (feedback table: via ID)
    fetch('/api/feedback/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbackId, responseText: text })
    });
    */
  });
});

// Attach Dispute button 
document.querySelectorAll('.dispute-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const li = btn.closest('.feedback-item');
    const feedbackId = li.getAttribute('data-feedback-id');
    const responseDiv = li.querySelector('.feedback-response');

	//pop up to confirm user is sure to dispute
    const sure = confirm('Do you want to dispute this feedback?');
    if (!sure) return;

	//mark feedback as in process (later can be accessed via admin)
    responseDiv.innerHTML = 'Dispute submitted <span class="badge">Pending review</span>';

    /* possible database code (feedback table: via ID)
    fetch('/api/feedback/dispute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbackId })
    });
    */
  });
});
