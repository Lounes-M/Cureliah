import React from 'react';

const PaymentSuccess = () => {
  return (
    <div className="payment-success-container">
      <h2>Payment Successful!</h2>
      <p>Thank you for your payment. Your transaction has been completed successfully.</p>
      <button onClick={() => window.location.href = '/'}>Return to Home</button>
    </div>
  );
};

export default PaymentSuccess;
