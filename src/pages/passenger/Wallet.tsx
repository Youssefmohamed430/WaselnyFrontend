import { useEffect, useState } from 'react';
import AuthService from '../../services/authService';
import walletService from '../../services/walletService';
import signalRService from '../../services/signalRService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { showToast } from '../../utils/toast';

const Wallet = () => {
  const authService = new AuthService();
  const user = authService.getUserInfo();
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [charging, setCharging] = useState(false);
  const [chargeAmount, setChargeAmount] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentIframeUrl, setPaymentIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadWallet();
      connectNotifications();
    }

    return () => {
      signalRService.disconnectNotifications();
    };
  }, [user?.id]);

  const loadWallet = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await walletService.getById(user.id);
      if (response.isSuccess && response.result) {
        setWallet({ balance: response.result.balance });
      } else {
        setError(response.message || 'Failed to load wallet');
      }
    } catch (error) {
      setError('Failed to load wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const connectNotifications = async () => {
    if (!user?.id) return;
    try {
      await signalRService.connectNotifications(user.id, (notification) => {
        if (notification.msg.toLowerCase().includes('wallet') && notification.msg.toLowerCase().includes('success')) {
          showToast(notification.msg, 'success');
          loadWallet();
          setShowPaymentModal(false);
          setPaymentIframeUrl(null);
        }
      });
    } catch (error) {
      console.error('Failed to connect to notifications:', error);
    }
  };

  const handleChargeWallet = async () => {
    if (!user?.id) return;

    const amount = parseFloat(chargeAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount < 10) {
      setError('Minimum charge amount is 10 EGP');
      return;
    }

    setCharging(true);
    setError(null);

    try {
      const response = await walletService.chargeWallet(amount, user.id);
      if (response.isSuccess && response.iframeUrl) {
        setPaymentIframeUrl(response.iframeUrl);
        setShowPaymentModal(true);
      } else {
        setError(response.message || 'Failed to initiate payment');
      }
    } catch (error) {
      setError('Failed to charge wallet. Please try again.');
    } finally {
      setCharging(false);
    }
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setPaymentIframeUrl(null);
    setChargeAmount('');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Wallet</h1>
        <p className="mt-2 text-gray-600">Manage your wallet balance and transactions</p>
      </div>

      {/* Wallet Balance Card */}
      <div className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 p-8 text-white shadow-lg">
        <p className="text-sm font-medium text-green-100">Current Balance</p>
        <p className="mt-2 text-5xl font-bold">
          {wallet ? `${wallet.balance.toFixed(2)} EGP` : '0.00 EGP'}
        </p>
      </div>

      {/* Charge Wallet Section */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Charge Wallet</h2>
        {error && <ErrorMessage message={error} />}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Amount (EGP)</label>
            <input
              type="number"
              min="10"
              step="0.01"
              value={chargeAmount}
              onChange={(e) => setChargeAmount(e.target.value)}
              placeholder="Enter amount (minimum 10 EGP)"
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleChargeWallet}
            disabled={charging || !chargeAmount}
            className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {charging ? 'Processing...' : 'Charge Wallet'}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && paymentIframeUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative mx-4 w-full max-w-4xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-800">Complete Payment</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <iframe
                src={paymentIframeUrl}
                className="h-[600px] w-full rounded-md border"
                title="Payment"
                allow="payment"
              />
            </div>
            <div className="border-t px-6 py-4">
              <p className="text-sm text-gray-600">
                Complete your payment in the form above. Your wallet will be updated automatically after successful payment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;

