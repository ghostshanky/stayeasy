import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import apiClient from '../../api/apiClient';

interface Payment {
  id: string;
  amount: number;
  upiReference?: string;
  createdAt: string;
  user: { name: string; email: string };
  booking: { property: { name: string } };
}

const verifySchema = z.object({
  note: z.string().max(255, 'Note is too long').optional(),
});

type VerifyFormData = z.infer<typeof verifySchema>;

function VerificationModal({ isOpen, onClose, payment, onVerified }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  const handleAction = async (verified: boolean, data: VerifyFormData) => {
    const action = verified ? 'Verifying' : 'Rejecting';
    const toastId = toast.loading(`${action} payment...`);
    try {
      await apiClient.post('/payments/verify', {
        paymentId: payment.id,
        verified,
        note: data.note,
      });
      toast.success(`Payment ${verified ? 'verified' : 'rejected'} successfully!`, { id: toastId });
      onVerified(payment.id, verified);
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || `Failed to ${action.toLowerCase()} payment.`;
      toast.error(errorMessage, { id: toastId });
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                Verify Payment
              </Dialog.Title>
              <div className="mt-2">
                <p><strong>Tenant:</strong> {payment?.user.name} ({payment?.user.email})</p>
                <p><strong>Amount:</strong> ₹{(payment?.amount / 100).toFixed(2)}</p>
                <p><strong>UPI Reference:</strong> {payment?.upiReference || 'Not provided'}</p>
                <p><strong>Submitted:</strong> {new Date(payment?.createdAt).toLocaleString()}</p>
              </div>

              <form className="mt-4">
                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                    Note (optional, for rejection)
                  </label>
                  <textarea
                    id="note"
                    {...register('note')}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., Amount mismatch, transaction not found."
                  />
                </div>

                <div className="mt-6 flex justify-end space-x-4">
                  <button type="button" onClick={onClose} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300">Cancel</button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmit((data) => handleAction(false, data))}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-red-300"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmit((data) => handleAction(true, data))}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-green-300"
                  >
                    Verify
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function OwnerPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    const fetchPendingPayments = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/payments/pending');
        setPayments(response.data.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load pending payments.');
        toast.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPayments();
  }, []);

  const handleVerificationComplete = (paymentId: string) => {
    setPayments(prev => prev.filter(p => p.id !== paymentId));
  };

  if (loading) return <div className="p-6">Loading pending payments...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Verifications</h1>
      {payments.length === 0 ? (
        <p>No payments are currently awaiting your verification.</p>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="bg-white shadow-md rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">₹{(payment.amount / 100).toFixed(2)}</p>
                <p className="text-sm text-gray-600">For: {payment.booking.property.name}</p>
                <p className="text-sm text-gray-600">From: {payment.user.name} ({payment.user.email})</p>
                <p className="text-xs text-gray-400 mt-1">Ref: {payment.upiReference || 'N/A'} | Submitted: {new Date(payment.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedPayment(payment)}
                  className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPayment && (
        <VerificationModal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          payment={selectedPayment}
          onVerified={handleVerificationComplete}
        />
      )}
    </div>
  );
}
