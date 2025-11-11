// frontend/src/components/ListingForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../AuthContext'; // <-- NEW: Import Auth Context

const API_URL = 'http://localhost:8080/Rental/backend/api.php';

const ListingForm = ({ onListingAdded }) => {
    // 1. Get the user token from the Auth context
    const { user } = useAuth();
    const token = user?.token; // Optional chaining for safety
    
    const [formData, setFormData] = useState({
        title: '', location: '', price: 0, type: 'Apartment', description: '', image_url: '',
    });
    const [statusMessage, setStatusMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 2. Client-side Check: Ensure token exists before sending
        if (!token) {
            setStatusMessage('Error: Authentication token missing. Please log in again.');
            return;
        }

        setIsSubmitting(true);
        setStatusMessage('Submitting listing...');

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // 3. FIX: Include the Authorization header with the token
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(formData),
            });
            const result = await response.json();

            // Check for unauthorized access (e.g., if token expired or was invalid)
            if (response.status === 401 || response.status === 403) {
                 setStatusMessage('Error: Unauthorized. Check user role.');
                 return;
            }

            if (response.ok && result.success) {
                setStatusMessage('Listing added successfully!');
                setFormData({ title: '', location: '', price: 0, type: 'Apartment', description: '', image_url: '' }); // Reset form
                onListingAdded(); // Trigger refresh in parent component
            } else {
                setStatusMessage(`Error: ${result.error || 'Failed to submit.'}`);
            }
        } catch (error) {
            setStatusMessage('Network error: Could not reach the server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="listing-form">
            <h2>Post a New Rental Listing</h2>
            
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
            
            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Listing'}
            </button>
            
            {statusMessage && <p className={`status ${statusMessage.includes('successfully') ? 'success' : 'error'}`}>{statusMessage}</p>}
        </form>
    );
};

export default ListingForm;