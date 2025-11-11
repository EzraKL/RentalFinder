// frontend/src/components/EditListingForm.jsx
import React, { useState } from 'react';

const API_URL = 'http://localhost:8080/Rental/backend/api.php';
const EditListingForm = ({ listing, onUpdateSuccess, onCancel }) => {
    const [formData, setFormData] = useState(listing);
    const [statusMessage, setStatusMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMessage('Updating listing...');

        try {
            const response = await fetch(API_URL, {
                method: 'PUT', // Key: Using PUT method
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const result = await response.json();

            if (response.ok && result.success) {
                setStatusMessage('Update successful!');
                onUpdateSuccess(); // Trigger parent refresh and modal close
            } else {
                setStatusMessage(`Error: ${result.error || 'Failed to update.'}`);
            }
        } catch (error) {
            setStatusMessage('Network error: Could not reach the server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <form onSubmit={handleSubmit} className="listing-form edit-form">
                <h2>Edit Listing #{listing.id}</h2>
                
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Title" required />
                <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Location" required />
                <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price" required min="1000" />
                
                <select name="type" value={formData.type} onChange={handleChange}>
                    <option value="Apartment">Apartment</option>
                    <option value="Studio">Studio</option>
                    <option value="House">House</option>
                    <option value="Single Room">Single Room</option>
                </select>
                
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description"></textarea>
                <input type="url" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="Image URL (Optional)" />
                
                <div className="button-group">
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={onCancel} className="cancel-button" disabled={isSubmitting}>
                        Cancel
                    </button>
                </div>
                
                {statusMessage && <p className={`status ${statusMessage.includes('successful') ? 'success' : 'error'}`}>{statusMessage}</p>}
            </form>
        </div>
    );
};

export default EditListingForm;