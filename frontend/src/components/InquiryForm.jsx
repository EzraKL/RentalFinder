// frontend/src/components/InquiryForm.jsx
import React, { useState } from 'react';

// IMPORTANT: Use your correct port (e.g., :8080) and folder name ('Rental')
const INQUIRY_API = 'http://localhost:8080/Rental/backend/inquiry.php'; 

const InquiryForm = ({ listingId, listingTitle, onInquirySubmit, onCancel }) => {
    // State to hold the new contact information
    const [formData, setFormData] = useState({
        contact_phone: '',
        contact_email: '',
        preferred_time: 'Anytime',
    });
    const [statusMessage, setStatusMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMessage('Submitting contact request...');

        // Combine listing ID with form data
        const payload = { ...formData, listing_id: listingId };

        try {
            const response = await fetch(INQUIRY_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setStatusMessage(result.message);
                setTimeout(onInquirySubmit, 2000); 
            } else {
                setStatusMessage(`Error: ${result.error || 'Failed to submit contact request.'}`);
            }
        } catch (error) {
            setStatusMessage('Network error: Could not reach the inquiry server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <form onSubmit={handleSubmit} className="inquiry-form">
                <h2>Request Contact for: {listingTitle}</h2>
                
                <input 
                    type="tel" 
                    name="contact_phone" 
                    value={formData.contact_phone}
                    onChange={handleChange}
                    placeholder="Your Best Contact Phone" 
                    required
                />
                
                <input 
                    type="email" 
                    name="contact_email" 
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="Your Email Address" 
                    required
                />
                
                <select name="preferred_time" value={formData.preferred_time} onChange={handleChange}>
                    <option value="Anytime">Anytime</option>
                    <option value="Morning (9am-12pm)">Morning (9am-12pm)</option>
                    <option value="Afternoon (1pm-5pm)">Afternoon (1pm-5pm)</option>
                    <option value="Evening (5pm-8pm)">Evening (5pm-8pm)</option>
                </select>
                
                <div className="button-group">
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Sending...' : 'Send Contact Request'}
                    </button>
                    <button type="button" onClick={onCancel} className="cancel-button" disabled={isSubmitting}>
                        Cancel
                    </button>
                </div>
                
                {statusMessage && <p className={`status ${statusMessage.includes('successfully') ? 'success' : 'error'}`}>{statusMessage}</p>}
            </form>
        </div>
    );
};

export default InquiryForm;