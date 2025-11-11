// frontend/src/components/PosterDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext'; 

// IMPORTANT: Use your correct port (e.g., :8080) and folder name ('Rental')
const DASHBOARD_API = 'http://localhost:8080/Rental/backend/dashboard.php'; 

const PosterDashboard = () => {
    const { user } = useAuth();
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInquiries = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // NOTE: In a production app, you would send the user token in the headers here
            const response = await fetch(DASHBOARD_API); 
            const result = await response.json();

            if (result.success) {
                setInquiries(result.data);
            } else {
                setError(result.error || 'Failed to load dashboard data.');
            }
        } catch (e) {
            setError('Could not connect to the dashboard API.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Function to update the inquiry status (POST request to the same endpoint)
    const updateStatus = async (inquiryId, newStatus) => {
        if (!window.confirm(`Mark inquiry #${inquiryId} as ${newStatus}?`)) return;

        try {
            const response = await fetch(DASHBOARD_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inquiry_id: inquiryId, status: newStatus }),
            });
            const result = await response.json();

            if (result.success) {
                // Refresh the list immediately to show the new status
                fetchInquiries(); 
            } else {
                alert(`Status update failed: ${result.error}`);
            }
        } catch (e) {
            alert('Network error during status update.');
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, [fetchInquiries]);

    if (loading) return <p>Loading inquiries...</p>;
    if (error) return <p style={{color: 'red'}}>Error: {error}</p>;

    return (
        <div className="dashboard-container">
            <h2>📞 Your Listing Inquiries ({inquiries.filter(i => i.status === 'new').length} New)</h2>
            
            {inquiries.length === 0 ? (
                <p>No contact requests for your currently posted listings.</p>
            ) : (
                inquiries.map(inquiry => (
                    <div key={inquiry.inquiry_id} className={`inquiry-card status-${inquiry.status}`}>
                        <div className="inquiry-header">
                            <h3>{inquiry.listing_title} - {inquiry.listing_location}</h3>
                            <span className="inquiry-status">{inquiry.status.toUpperCase()}</span>
                        </div>
                        
                        <p>Tenant: **{inquiry.tenant_username}**</p>
                        
                        {/* Display the contact details the tenant provided */}
                        <div className="contact-details">
                            <p>📞 **Phone:** {inquiry.contact_phone}</p>
                            <p>📧 **Email:** {inquiry.contact_email}</p>
                            <p>⏰ **Best Time:** {inquiry.preferred_time}</p>
                            <p className="inquiry-date">Submitted: {new Date(inquiry.created_at).toLocaleDateString()}</p>
                        </div>

                        <div className="inquiry-actions">
                            <button 
                                onClick={() => updateStatus(inquiry.inquiry_id, 'contacted')}
                                disabled={inquiry.status === 'contacted'}
                            >
                                {inquiry.status === 'new' ? 'Mark Contacted' : 'Contacted'}
                            </button>
                            <button 
                                onClick={() => updateStatus(inquiry.inquiry_id, 'resolved')}
                                disabled={inquiry.status === 'resolved'}
                            >
                                Mark Resolved
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default PosterDashboard;