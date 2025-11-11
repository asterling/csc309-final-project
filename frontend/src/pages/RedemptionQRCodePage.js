import React from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

function RedemptionQRCodePage() {
  const { transactionId } = useParams();
  const qrCodeValue = `redemption:${transactionId}`; // Format for the QR code

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-header">
          <h1 className="text-center">Redemption Request QR Code</h1>
        </div>
        <div className="card-body text-center">
          <p>Show this QR code to a cashier to process your redemption request.</p>
          {transactionId ? (
            <div className="d-flex justify-content-center mt-3">
              <QRCodeSVG value={qrCodeValue} size={256} level="H" />
            </div>
          ) : (
            <div className="alert alert-warning">No redemption request ID found.</div>
          )}
          <p className="mt-3">Redemption ID: <strong>{transactionId}</strong></p>
        </div>
      </div>
    </div>
  );
}

export default RedemptionQRCodePage;