// frontend/src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import ListingForm from './components/ListingForm';
import EditListingForm from './components/EditListingForm'; 
import AuthScreen from './components/AuthScreen'; 
import { useAuth } from './AuthContext'; 
import InquiryForm from './components/InquiryForm'; 
import PosterDashboard from './components/PosterDashboard'; 
//import SearchBar from './components/SearchBar'; // <-- REQUIRED for tenant view logic
import './App.css';

const API_URL = 'http://localhost:8080/Rental/backend/api.php';

const App = () => {
    // 1. Get user state and helper functions from context
    const { user, isAuthenticated, isPoster, logout } = useAuth();
    
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingListing, setEditingListing] = useState(null); 
    // FIX 1: Added missing 'currentFilters' state
    const [currentFilters, setCurrentFilters] = useState({}); 
    const [inquiryListing, setInquiryListing] = useState(null); 

    const fetchListings = useCallback(async () => {
        setLoading(true);
        setError(null);

        // Construct the Query String from currentFilters
        const params = new URLSearchParams(currentFilters).toString();
        const fetchURL = `${API_URL}?${params}`;

        try {
            const response = await fetch(fetchURL); 
            const result = await response.json();

            if (result.success) {
                setListings(result.data); 
            } else {
                setError(result.error || 'Failed to fetch listings.');
            }
        } catch (e) {
            setError("Could not connect to the backend API.");
        } finally {
            setLoading(false);
        }
    }, [currentFilters]); // FIX 2: Added 'currentFilters' to dependencies

    // Handle Delete Request (unchanged)
    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete listing #${id}?`)) {
            return;
        }

        try {
            // Note: For full security, token must be sent in headers here too
            const response = await fetch(API_URL, {
                method: 'DELETE', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }), 
            });
            const result = await response.json();

            if (response.ok && result.success) {
                fetchListings();
            } else {
                alert(`Deletion Failed: ${result.error}`);
            }
        } catch (error) {
            alert('Network error: Could not reach the server for deletion.');
        }
    };
    
    // Function to handle the search submission from SearchBar
    const handleSearch = (filters) => {
        setCurrentFilters(filters); 
    };

    // Control fetch logic based on authentication status and filters
    useEffect(() => {
        if (isAuthenticated) {
            fetchListings();
        } else {
            setLoading(false); 
            setListings([]);
        }
    }, [isAuthenticated, fetchListings]);

    // --- Conditional Rendering Logic ---
    if (loading) return <h1>Loading Rentals...</h1>;
    if (error) return <h1 style={{color: 'red'}}>Error: {error}</h1>;

    // Show AuthScreen if user is NOT authenticated
    if (!isAuthenticated) {
        return <AuthScreen />;
    }
    // --- End Conditional Rendering ---


    // 4. Main App Render (Only runs if isAuthenticated is TRUE)
    return (
        <div className="app-container">
            {/* Show Inquiry Modal if inquiryListing state is set */}
            {inquiryListing && (
                <InquiryForm
                    listingId={inquiryListing.id}
                    listingTitle={inquiryListing.title}
                    onInquirySubmit={() => setInquiryListing(null)}
                    onCancel={() => setInquiryListing(null)}
                />
            )}

            {/* Show the edit form if a listing is selected */}
            {editingListing && (
                <EditListingForm 
                    listing={editingListing} 
                    onCancel={() => setEditingListing(null)}
                    onUpdateSuccess={() => {
                        setEditingListing(null);
                        fetchListings(); // Refresh list to show updated data
                    }}
                />
            )}

            <header>
                <h1>🏡 Rental Finder</h1>
                {/* User Status and Logout Button */}
                <div className="auth-status"> 
                    {/* FIX 3: Removed markdown bold syntax */}
                    <span>Welcome, {user.username} ({user.role})!</span>
                    <button onClick={logout} className="logout-button">Logout</button>
                </div>
            </header>
            
            <hr style={{ margin: '20px 0' }} />

            {isPoster ? (
                // --- POSTER DASHBOARD VIEW ---
                <>
                    <PosterDashboard />
                    <hr />
                    <h3>Post New Listing</h3>
                    <ListingForm onListingAdded={() => setCurrentFilters({})} /> 
                </>
            ) : (
                // --- TENANT LISTING VIEW ---
                <>
                    <SearchBar onSearch={handleSearch} /> {/* Show SearchBar for Tenants */}
                    <hr />
                    <h2>Available Listings ({listings.length})</h2>
                    <div className="listings-grid">
                        {listings.map(listing => (
                            <div key={listing.id} className="listing-card">
                                <img src={listing.image_url} alt={listing.title} />
                                <h3>{listing.title}</h3>
                                <p>📍 {listing.location}</p>
                                <p className="price">💰 ${parseFloat(listing.price).toLocaleString()}</p>
                                <p className="description">{listing.description}</p>
                                
                                <div className="card-actions">
                                    {/* Inquiry button for non-posters */}
                                    {!isPoster && ( 
                                        <button 
                                            className="inquiry-button" 
                                            onClick={() => setInquiryListing(listing)}
                                        >
                                            Inquire Now
                                        </button>
                                    )}
                                    
                                    {/* Authorization Check: Only show Edit/Delete if user is poster AND owner */}
                                    {user.id == listing.user_id && isPoster && (
                                        <>
                                            <button className="edit-button" onClick={() => setEditingListing(listing)}>Edit</button>
                                            <button className="delete-button" onClick={() => handleDelete(listing.id)}>Delete</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            
        </div>
    );
};

export default App;
