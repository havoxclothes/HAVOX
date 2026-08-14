const cancelForm = document.querySelector('#cancelForm');
if (cancelForm) {
  cancelForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const button = e.target.querySelector('button[type=submit]');
    button.disabled = true;
    button.textContent = 'SUBMITTING…';
    try {
      const response = await fetch('/api/cancellations', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({action:'request', orderNumber:data.get('order'), phone:data.get('phone'), reason:data.get('reason') || ''})
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to submit cancellation request');
      const message = `HAVOX CANCELLATION REQUEST\nOrder No: ${data.get('order')}\nPhone: ${data.get('phone')}\nReason: ${data.get('reason') || 'Not provided'}\nRequest ID: ${result.request.id}\n\nYour request has been recorded. HAVOX will review it and confirm the result.`;
      window.open(`https://wa.me/94751804730?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      alert(`Cancellation request #${result.request.id} was recorded successfully. HAVOX will review it.`);
      e.target.reset();
    } catch (error) {
      alert(error.message);
    } finally {
      button.disabled = false;
      button.textContent = 'REQUEST CANCELLATION VIA WHATSAPP';
    }
  };
}
