import React, { useState, useEffect } from 'react';
import { contractService, authService } from '../services/api';
import './ContractForm.css';

const ContractForm = ({ contractId, onClose, onSignSuccess }) => {
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        rent: '',
        deposit: ''
    });
    const [saving, setSaving] = useState(false);

    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        fetchContract();
    }, [contractId]);

    const fetchContract = async () => {
        try {
            const res = await contractService.getById(contractId);
            const data = res.data.contract;
            setContract(data);
            setFormData({
                start_date: data.start_date ? data.start_date.split('T')[0] : '',
                end_date: data.end_date ? data.end_date.split('T')[0] : '',
                rent: data.rent,
                deposit: data.deposit
            });
        } catch (err) {
            setError('Failed to load contract details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await contractService.update(contractId, formData);
            // Refresh contract
            await fetchContract();
            alert('Contract updated successfully!');
        } catch (err) {
            alert('Failed to update contract: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleSign = async () => {
        if (!window.confirm('Are you sure you want to sign this contract? This action is legally binding.')) return;

        try {
            await contractService.sign(contractId);
            await fetchContract();
            if (onSignSuccess) onSignSuccess();
            alert('Contract signed successfully!');
        } catch (err) {
            alert('Failed to sign contract: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div className="contract-modal-overlay"><div className="contract-modal">Loading...</div></div>;
    if (!contract) return null;

    const isLandlord = currentUser.id === contract.landlord_user_id;
    const isDraft = contract.status === 'draft';
    const canEdit = isLandlord && isDraft;

    // Check if current user has signed
    const hasSigned = contract.signatures?.some(s => s.user_id === currentUser.id);

    return (
        <div className="contract-modal-overlay" onClick={onClose}>
            <div className="contract-modal" onClick={e => e.stopPropagation()}>
                <div className="contract-header">
                    <h2 className="contract-title">Rental Agreement</h2>
                    <p className="contract-subtitle">#{contract.id} • {contract.status.toUpperCase()}</p>
                </div>

                <div className="contract-section">
                    <h3 className="section-title">Property Details</h3>
                    <p><strong>Address:</strong> {contract.property_address}</p>
                    <p><strong>Landlord:</strong> {contract.landlord_name} ({contract.landlord_email})</p>
                    <p><strong>Tenant(s):</strong> {contract.tenants?.map(t => t.full_name).join(', ')}</p>
                </div>

                <div className="contract-section">
                    <h3 className="section-title">Terms & Conditions</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                className="form-input"
                                value={formData.start_date}
                                onChange={handleInputChange}
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                className="form-input"
                                value={formData.end_date}
                                onChange={handleInputChange}
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Monthly Rent ($)</label>
                            <input
                                type="number"
                                name="rent"
                                className="form-input"
                                value={formData.rent}
                                onChange={handleInputChange}
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Security Deposit ($)</label>
                            <input
                                type="number"
                                name="deposit"
                                className="form-input"
                                value={formData.deposit}
                                onChange={handleInputChange}
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                    {canEdit && (
                        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="contract-section">
                    <h3 className="section-title">Signatures</h3>
                    <div className="signatures-list">
                        {/* Landlord Signature Status */}
                        <div className="signature-item">
                            <div className="signature-user">
                                <div className="signature-avatar">L</div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{contract.landlord_name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Landlord</div>
                                </div>
                            </div>
                            <div className="signature-status">
                                {contract.signatures?.some(s => s.user_id === contract.landlord_user_id) ? (
                                    <span className="status-signed">✓ Signed</span>
                                ) : (
                                    <span className="status-pending">Waiting</span>
                                )}
                            </div>
                        </div>

                        {/* Tenant Signatures Status */}
                        {contract.tenants?.map(tenant => (
                            <div className="signature-item" key={tenant.id}>
                                <div className="signature-user">
                                    <div className="signature-avatar" style={{ background: '#ec4899' }}>T</div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{tenant.full_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Tenant</div>
                                    </div>
                                </div>
                                <div className="signature-status">
                                    {contract.signatures?.some(s => s.user_id === tenant.id) ? (
                                        <span className="status-signed">✓ Signed</span>
                                    ) : (
                                        <span className="status-pending">Waiting</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="contract-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                    {!hasSigned && (
                        <button className="btn btn-primary" onClick={handleSign}>
                            Confirm & Sign Contract
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractForm;
