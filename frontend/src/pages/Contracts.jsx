import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractService, authService } from '../services/api';
import Navbar from '../components/Navbar';
import './Contracts.css';

const Contracts = () => {
    const navigate = useNavigate();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedContract, setSelectedContract] = useState(null);
    const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        rent: '',
        deposit: ''
    });
    const [landlordEndDate, setLandlordEndDate] = useState('');
    const [tenantEndDate, setTenantEndDate] = useState('');
    const [landlordSavedEndDate, setLandlordSavedEndDate] = useState('');
    const [tenantSavedEndDate, setTenantSavedEndDate] = useState('');
    const [tenantConfirmed, setTenantConfirmed] = useState(false);
    const [landlordConfirmed, setLandlordConfirmed] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingEndDate, setSavingEndDate] = useState(false);

    const user = authService.getCurrentUser();
    const isLandlord = user?.role === 'landlord';

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchContracts();
    }, [user?.id]);

    useEffect(() => {
        if (selectedContract) {
            setFormData({
                start_date: selectedContract.start_date ? selectedContract.start_date.split('T')[0] : '',
                end_date: selectedContract.end_date ? selectedContract.end_date.split('T')[0] : '',
                rent: selectedContract.rent || '',
                deposit: selectedContract.deposit || ''
            });
            // Check if already confirmed
            const landlordSigned = selectedContract.signatures?.some(s => s.user_id === selectedContract.landlord_user_id);
            const tenantSigned = selectedContract.tenants?.some(tenant => 
                selectedContract.signatures?.some(s => s.user_id === tenant.id)
            );
            setLandlordConfirmed(!!landlordSigned);
            setTenantConfirmed(!!tenantSigned);
            
            // Load proposed end dates from backend
            const proposedDates = selectedContract.proposed_end_dates || {};
            // Handle date string properly - if it's a date string, use it directly, if it's a Date object, format it
            const formatDateString = (dateValue) => {
                if (!dateValue) return '';
                if (typeof dateValue === 'string') {
                    // If it's already in YYYY-MM-DD format, use it directly
                    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        return dateValue;
                    }
                    // Otherwise, split by T to get date part
                    return dateValue.split('T')[0];
                }
                // If it's a Date object, format it
                const date = new Date(dateValue);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            
            const landlordProposed = formatDateString(proposedDates.landlord);
            const tenantProposed = proposedDates.tenants && selectedContract.tenants?.length > 0 
                ? formatDateString(proposedDates.tenants[selectedContract.tenants[0].id])
                : '';
            
            setLandlordSavedEndDate(landlordProposed);
            setTenantSavedEndDate(tenantProposed);
            setLandlordEndDate(landlordProposed);
            setTenantEndDate(tenantProposed);
        }
    }, [selectedContract]);

    const fetchContracts = async () => {
        try {
            const res = await contractService.getAll();
            setContracts(res.data.contracts);
        } catch (err) {
            setError('Failed to load contracts.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchContractDetails = async (id) => {
        try {
            const res = await contractService.getById(id);
            setSelectedContract(res.data.contract);
        } catch (err) {
            setError('Failed to load contract details.');
            console.error(err);
        }
    };

    const handleContractClick = (id) => {
        fetchContractDetails(id);
    };

    const handleCloseForm = () => {
        setSelectedContract(null);
        setTenantConfirmed(false);
        setLandlordConfirmed(false);
        setLandlordEndDate('');
        setTenantEndDate('');
        setLandlordSavedEndDate('');
        setTenantSavedEndDate('');
    };

    const handleSaveEndDate = async () => {
        const currentEndDate = isLandlord ? landlordEndDate : tenantEndDate;
        
        if (!currentEndDate) {
            alert('Please select an end date first.');
            return;
        }

        if (!selectedContract) {
            alert('No contract selected.');
            return;
        }

        setSavingEndDate(true);
        try {
            await contractService.saveProposedEndDate(selectedContract.id, currentEndDate);
            
            // Update saved end date
            if (isLandlord) {
                setLandlordSavedEndDate(currentEndDate);
            } else {
                setTenantSavedEndDate(currentEndDate);
            }
            
            // Refresh contract to get updated proposed dates
            await fetchContractDetails(selectedContract.id);
            
            alert('End date saved successfully! The other party can now see your proposed date.');
        } catch (err) {
            alert('Failed to save end date: ' + (err.response?.data?.error || err.message));
        } finally {
            setSavingEndDate(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLandlordEndDateChange = (e) => {
        setLandlordEndDate(e.target.value);
    };

    const handleTenantEndDateChange = (e) => {
        setTenantEndDate(e.target.value);
    };

    const handleConfirm = async (role) => {
        if (role === 'tenant' && user.role !== 'tenant') {
            alert('Only tenants can confirm as tenant.');
            return;
        }
        if (role === 'landlord' && user.role !== 'landlord') {
            alert('Only landlords can confirm as landlord.');
            return;
        }

        if (!selectedContract) {
            alert('No contract selected.');
            return;
        }

        // Check if end date is saved
        const currentSavedEndDate = isLandlord ? landlordSavedEndDate : tenantSavedEndDate;
        if (!currentSavedEndDate) {
            alert('Please save your end date first before confirming.');
            return;
        }

        // Get the other party's saved end date
        const otherSavedEndDate = isLandlord ? tenantSavedEndDate : landlordSavedEndDate;
        
        // If other party hasn't saved end date yet, inform user
        if (!otherSavedEndDate) {
            alert(`You have saved end date: ${currentSavedEndDate}.\n\nPlease wait for the other party to save their end date before confirming.`);
            return;
        }

        // Both parties have saved end dates - check if they match
        if (currentSavedEndDate !== otherSavedEndDate) {
            alert(`End dates do not match!\n\nLandlord saved: ${landlordSavedEndDate || 'Not saved'}\nTenant saved: ${tenantSavedEndDate || 'Not saved'}\n\nPlease coordinate to select and save the same end date.`);
            return;
        }

        // End dates match - proceed with confirmation
        if (!window.confirm(`Both parties have saved the same end date: ${currentSavedEndDate}\n\nAre you sure you want to confirm this contract as ${role}? This action is legally binding.`)) {
            return;
        }

        try {
            // Update contract with the agreed end date first
            await contractService.update(selectedContract.id, {
                end_date: currentSavedEndDate
            });

            // Sign the contract (backend will automatically update status to 'signed' when all parties sign)
            await contractService.sign(selectedContract.id);
            
            // Refresh contract details to get updated signatures
            await fetchContractDetails(selectedContract.id);
            
            // Check if both confirmed
            const updatedRes = await contractService.getById(selectedContract.id);
            const contract = updatedRes.data.contract;
            const landlordSigned = contract.signatures?.some(s => s.user_id === contract.landlord_user_id);
            const allTenantsSigned = contract.tenants?.every(tenant => 
                contract.signatures?.some(s => s.user_id === tenant.id)
            );

            if (landlordSigned && allTenantsSigned && contract.status === 'signed') {
                alert('Contract confirmed by both parties! Contract is now active.');
                await fetchContracts();
            } else {
                alert('Confirmation recorded. Waiting for other party to confirm.');
            }
        } catch (err) {
            alert('Failed to confirm: ' + (err.response?.data?.error || err.message));
        }
    };

    const getDashboardPath = () => {
        if (!user) return '/login';
        if (user.role === 'landlord') return '/landlord/dashboard';
        if (user.role === 'tenant') return '/tenant/dashboard';
        return '/dashboard';
    };

    if (loading) return (
        <>
            <Navbar title="Contracts" />
            <div className="loading-spinner">Loading contracts...</div>
        </>
    );

    return (
        <>
            <Navbar title={isLandlord ? "Manage Contracts" : "My Contracts"} />

            <div className="contracts-container">
                <header className="contracts-header">
                    <button 
                        className="btn-back"
                        onClick={() => navigate(getDashboardPath())}
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 className="page-title">{isLandlord ? "Contract Management" : "My Rental Agreements"}</h1>
                    <p className="page-subtitle">View and sign your rental contracts.</p>
                </header>

                {error && <div className="error-banner">{error}</div>}

                {!selectedContract ? (
                    <>
                        {contracts.length === 0 ? (
                            <div className="empty-state">
                                <p>No contracts found.</p>
                            </div>
                        ) : (
                            <div className="contracts-grid">
                                {contracts.map(contract => (
                                    <div
                                        key={contract.id}
                                        className="contract-card"
                                        onClick={() => handleContractClick(contract.id)}
                                    >
                                        <div className="card-header">
                                            <span className={`status-badge ${contract.status}`}>
                                                {contract.status.toUpperCase()}
                                            </span>
                                            <span className="contract-id">#{contract.id}</span>
                                        </div>

                                        <div className="card-body">
                                            <h3 className="property-address">{contract.property_address || 'N/A'}</h3>
                                            <div className="contract-details">
                                                <p><strong>Rent:</strong> ${contract.rent || 'N/A'}/mo</p>
                                                <p><strong>Start:</strong> {contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'N/A'}</p>
                                                <p><strong>Landlord:</strong> {contract.landlord_name || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="card-footer">
                                            <button className="btn-view">View & Sign &rarr;</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="contract-form-container">
                        <div className="contract-form-header">
                            <h2>Contract Details</h2>
                            <button className="btn-close" onClick={handleCloseForm}>×</button>
                        </div>

                        <div className="contract-form-section">
                            <h3>Property Information</h3>
                            <div className="form-info">
                                <p><strong>Address:</strong> {selectedContract.property_address || 'N/A'}</p>
                                <p><strong>Landlord:</strong> {selectedContract.landlord_name || 'N/A'} ({selectedContract.landlord_email || 'N/A'})</p>
                                <p><strong>Tenant(s):</strong> {selectedContract.tenants?.map(t => t.full_name).join(', ') || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="contract-form-section">
                            <h3>Contract Terms</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        disabled={true}
                                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Monthly Rent ($)</label>
                                    <input
                                        type="number"
                                        name="rent"
                                        value={formData.rent}
                                        disabled={true}
                                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Security Deposit ($)</label>
                                    <input
                                        type="number"
                                        name="deposit"
                                        value={formData.deposit}
                                        disabled={true}
                                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                    />
                                </div>
                            </div>
                            
                            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                                <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>End Date Selection</h4>
                                <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
                                    Both parties must select the same end date to confirm the contract.
                                </p>
                                
                                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Landlord's Proposed End Date</label>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                                            <input
                                                type="date"
                                                value={landlordEndDate}
                                                onChange={handleLandlordEndDateChange}
                                                disabled={!isLandlord || selectedContract.status !== 'draft' || landlordConfirmed}
                                                min={formData.start_date}
                                                style={{ flex: 1 }}
                                            />
                                            {isLandlord && selectedContract.status === 'draft' && !landlordConfirmed && (
                                                <button
                                                    className="btn-save"
                                                    onClick={handleSaveEndDate}
                                                    disabled={!landlordEndDate || savingEndDate || landlordEndDate === landlordSavedEndDate}
                                                    style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}
                                                >
                                                    {savingEndDate ? 'Saving...' : 'Save'}
                                                </button>
                                            )}
                                        </div>
                                        {landlordSavedEndDate && (
                                            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
                                                ✓ Landlord saved: {landlordSavedEndDate}
                                            </p>
                                        )}
                                        {landlordEndDate && landlordEndDate !== landlordSavedEndDate && (
                                            <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: '#f59e0b' }}>
                                                ⚠ Unsaved changes
                                            </p>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Tenant's Proposed End Date</label>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                                            <input
                                                type="date"
                                                value={tenantEndDate}
                                                onChange={handleTenantEndDateChange}
                                                disabled={isLandlord || selectedContract.status !== 'draft' || tenantConfirmed}
                                                min={formData.start_date}
                                                style={{ flex: 1 }}
                                            />
                                            {!isLandlord && selectedContract.status === 'draft' && !tenantConfirmed && (
                                                <button
                                                    className="btn-save"
                                                    onClick={handleSaveEndDate}
                                                    disabled={!tenantEndDate || savingEndDate || tenantEndDate === tenantSavedEndDate}
                                                    style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}
                                                >
                                                    {savingEndDate ? 'Saving...' : 'Save'}
                                                </button>
                                            )}
                                        </div>
                                        {tenantSavedEndDate && (
                                            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
                                                ✓ Tenant saved: {tenantSavedEndDate}
                                            </p>
                                        )}
                                        {tenantEndDate && tenantEndDate !== tenantSavedEndDate && (
                                            <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: '#f59e0b' }}>
                                                ⚠ Unsaved changes
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                {landlordSavedEndDate && tenantSavedEndDate && (
                                    <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '6px', 
                                        backgroundColor: landlordSavedEndDate === tenantSavedEndDate ? '#d1fae5' : '#fee2e2',
                                        color: landlordSavedEndDate === tenantSavedEndDate ? '#059669' : '#dc2626' }}>
                                        {landlordSavedEndDate === tenantSavedEndDate ? (
                                            <strong>✓ End dates match! Both parties can now confirm the contract.</strong>
                                        ) : (
                                            <strong>⚠ End dates do not match. Please coordinate to select and save the same date.</strong>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="contract-form-section">
                            <h3>Confirmation Status</h3>
                            <div className="confirmation-status">
                                <div className="confirmation-item">
                                    <span><strong>Landlord:</strong> {selectedContract.landlord_name || 'N/A'}</span>
                                    <span className={landlordConfirmed ? 'status-confirmed' : 'status-pending'}>
                                        {landlordConfirmed ? '✓ Confirmed' : 'Pending'}
                                    </span>
                                </div>
                                {selectedContract.tenants?.map(tenant => (
                                    <div key={tenant.id} className="confirmation-item">
                                        <span><strong>Tenant:</strong> {tenant.full_name}</span>
                                        <span className={tenantConfirmed ? 'status-confirmed' : 'status-pending'}>
                                            {tenantConfirmed ? '✓ Confirmed' : 'Pending'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="contract-form-actions">
                            {selectedContract.status === 'draft' && (
                                <>
                                    {isLandlord && !landlordConfirmed && (
                                        <button 
                                            className="btn-confirm-landlord"
                                            onClick={() => handleConfirm('landlord')}
                                            disabled={!landlordSavedEndDate || !tenantSavedEndDate || landlordSavedEndDate !== tenantSavedEndDate}
                                            style={{ 
                                                opacity: (!landlordSavedEndDate || !tenantSavedEndDate || landlordSavedEndDate !== tenantSavedEndDate) ? 0.5 : 1,
                                                cursor: (!landlordSavedEndDate || !tenantSavedEndDate || landlordSavedEndDate !== tenantSavedEndDate) ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            Confirm as Landlord
                                        </button>
                                    )}
                                    {!isLandlord && !tenantConfirmed && (
                                        <button 
                                            className="btn-confirm-tenant"
                                            onClick={() => handleConfirm('tenant')}
                                            disabled={!landlordSavedEndDate || !tenantSavedEndDate || landlordSavedEndDate !== tenantSavedEndDate}
                                            style={{ 
                                                opacity: (!landlordSavedEndDate || !tenantSavedEndDate || landlordSavedEndDate !== tenantSavedEndDate) ? 0.5 : 1,
                                                cursor: (!landlordSavedEndDate || !tenantSavedEndDate || landlordSavedEndDate !== tenantSavedEndDate) ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            Confirm as Tenant
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Contracts;
