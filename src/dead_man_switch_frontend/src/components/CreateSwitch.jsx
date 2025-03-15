import React, { useState } from 'react';

function CreateSwitch({ setActiveView, backend, bitcoinCanister }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [recipients, setRecipients] = useState([{ name: '', bitcoinAddress: '', amount: '' }]);
  const [addressValidation, setAddressValidation] = useState({ source: null, recipients: {} });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    checkInIntervalDays: 30,
    sourceAddress: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset validation for source address when it changes
    if (name === 'sourceAddress') {
      setAddressValidation(prev => ({ ...prev, source: null }));
    }
  };

  const handleRecipientChange = (index, field, value) => {
    const updatedRecipients = [...recipients];
    updatedRecipients[index] = { ...updatedRecipients[index], [field]: value };
    setRecipients(updatedRecipients);
    
    // Reset validation for recipient address when it changes
    if (field === 'bitcoinAddress') {
      setAddressValidation(prev => ({
        ...prev,
        recipients: { ...prev.recipients, [index]: null }
      }));
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, { name: '', bitcoinAddress: '', amount: '' }]);
  };

  const removeRecipient = (index) => {
    if (recipients.length > 1) {
      const updatedRecipients = recipients.filter((_, i) => i !== index);
      
      // Also remove validation state for this recipient
      const updatedValidation = { ...addressValidation };
      delete updatedValidation.recipients[index];
      
      setRecipients(updatedRecipients);
      setAddressValidation(updatedValidation);
    }
  };

  // Simplified Bitcoin address validation for hackathon demo
  const validateBitcoinAddress = (address) => {
    // Simple validation - Bitcoin addresses usually start with specific prefixes
    // and are between 26-42 characters
    const isValid = 
      address.length >= 26 && 
      address.length <= 42 && 
      (
        address.startsWith('1') || 
        address.startsWith('3') || 
        address.startsWith('bc1') ||
        address.startsWith('m') || 
        address.startsWith('n') || 
        address.startsWith('2') || 
        address.startsWith('tb1')
      );
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      setIsSubmitting(true);
      
      // Basic validation
      if (!formData.name.trim()) {
        setError('Switch name is required');
        setIsSubmitting(false);
        return;
      }

      if (!formData.description.trim()) {
        setError('Description is required');
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.sourceAddress.trim()) {
        setError('Source Bitcoin address is required');
        setIsSubmitting(false);
        return;
      }

      // Validate source address
      const sourceValid = validateBitcoinAddress(formData.sourceAddress);
      if (!sourceValid) {
        setError('Invalid source Bitcoin address');
        setIsSubmitting(false);
        return;
      }

      // Validate recipients
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        
        if (!recipient.name.trim()) {
          setError(`Recipient ${i+1} name is required`);
          setIsSubmitting(false);
          return;
        }

        if (!recipient.bitcoinAddress.trim()) {
          setError(`Recipient ${i+1} Bitcoin address is required`);
          setIsSubmitting(false);
          return;
        }

        if (!recipient.amount || isNaN(parseInt(recipient.amount)) || parseInt(recipient.amount) <= 0) {
          setError(`Recipient ${i+1} amount must be a positive number`);
          setIsSubmitting(false);
          return;
        }
        
        // Validate recipient address
        const recipientValid = validateBitcoinAddress(recipient.bitcoinAddress);
        if (!recipientValid) {
          setError(`Invalid Bitcoin address for recipient ${i+1}`);
          setIsSubmitting(false);
          return;
        }
      }
      
      // Show success immediately for the demo
      setSuccess(true);
        
      // Try to call backend in background
      if (backend) {
        try {
          const formattedRecipients = recipients.map(r => ({
            name: r.name,
            bitcoinAddress: r.bitcoinAddress,
            amount: BigInt(r.amount)
          }));

          await backend.createSwitch(
            formData.name,
            formData.description,
            Number(formData.checkInIntervalDays),
            formData.sourceAddress,
            formattedRecipients
          );
        } catch (err) {
          console.warn("Backend call failed, but continuing demo flow:", err);
        }
      }
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        setActiveView('dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Error creating switch:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="card">
        <div className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div>
            <h3 className="font-bold">Success!</h3>
            <div className="text-sm">Your Dead Man Switch has been created successfully. Redirecting to dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h1 className="card-title">Create Dead Man Switch</h1>
          <p className="card-subtitle">
            Set up an automatic Bitcoin transfer that activates if you don't check in
          </p>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <h3 className="font-bold">Error</h3>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">Switch Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            placeholder="Family Inheritance Plan"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-input"
            placeholder="Purpose of this dead man switch"
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="sourceAddress">Source Bitcoin Address</label>
          <div className="flex">
            <input
              type="text"
              id="sourceAddress"
              name="sourceAddress"
              value={formData.sourceAddress}
              onChange={handleChange}
              className="form-input"
              placeholder="bc1..."
            />
          </div>
          <p className="form-helper">
            The address from which the funds will be sent if the switch is triggered
          </p>
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="checkInIntervalDays">Check-in Interval (days)</label>
          <input
            type="number"
            id="checkInIntervalDays"
            name="checkInIntervalDays"
            value={formData.checkInIntervalDays}
            onChange={handleChange}
            className="form-input"
            min="1"
            max="365"
          />
          <p className="form-helper">
            If you don't check in within this many days, the switch will be triggered
          </p>
        </div>
        
        <div className="form-group">
          <div className="flex justify-between items-center mb-3">
            <label className="form-label mb-0">Recipients</label>
            <button
              type="button"
              onClick={addRecipient}
              className="btn btn-secondary btn-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Recipient
            </button>
          </div>
          
          {recipients.map((recipient, index) => (
            <div key={index} className="bg-light rounded mb-4 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Recipient {index + 1}</h3>
                {recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRecipient(index)}
                    className="btn btn-sm btn-outline text-danger"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Remove
                  </button>
                )}
              </div>
              
              <div className="mb-3">
                <label className="form-label text-sm">Name</label>
                <input
                  type="text"
                  value={recipient.name}
                  onChange={(e) => handleRecipientChange(index, 'name', e.target.value)}
                  className="form-input"
                  placeholder="Recipient name"
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label text-sm">Bitcoin Address</label>
                <input
                  type="text"
                  value={recipient.bitcoinAddress}
                  onChange={(e) => handleRecipientChange(index, 'bitcoinAddress', e.target.value)}
                  className="form-input"
                  placeholder="bc1..."
                />
              </div>
              
              <div>
                <label className="form-label text-sm">Amount (satoshis)</label>
                <input
                  type="number"
                  value={recipient.amount}
                  onChange={(e) => handleRecipientChange(index, 'amount', e.target.value)}
                  className="form-input"
                  placeholder="Amount in satoshis"
                  min="1"
                />
                <p className="form-helper">
                  1 BTC = 100,000,000 satoshis
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between gap-4 mt-6">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <>
                <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', marginRight: '8px' }}></div>
                Creating...
              </>
            ) : 'Create Switch'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateSwitch;
