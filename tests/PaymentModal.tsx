import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import QRCode from 'qrcode.react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import apiClient from '../../api/apiClient';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: (status: 'confirmed' | 'cancelled') => void;
  paymentId: string;
  upiUri: string;
  qrDataUrl: string;
  amount: number;
}

const confirmSchema = z.object({
  upiReference: z.string().max(50, 'Reference ID is too long').optional(),
});

type ConfirmFormData = z.infer<typeof confirmSchema>;

export default function PaymentModal({ isOpen, onClose, paymentId, upiUri, qrDataUrl, amount }: PaymentModalProps) {
  const [showConfirmForm, setShowConfirmForm] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ConfirmFormData>({
    resolver: zodResolver(confirmSchema),
  });

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiUri);
    toast.success('UPI URI copied to clipboard!');
  };

  const onConfirmSubmit = async (data: ConfirmFormData) => {
    const toastId = toast.loading('Submitting confirmation...');
    try {
      await apiClient.post('/payments/confirm', {
        paymentId,
        upiReference: data.upiReference,
      });
      toast.success('Payment submitted for verification!', { id: toastId });
      onClose('confirmed');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to confirm payment.';
      toast.error(errorMessage, { id: toastId });
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => { /* Prevent closing */ }}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Complete Your Payment
                </Dialog.Title>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">Scan the QR code with any UPI app or copy the UPI link.</p>
                  <div className="my-4 inline-block border p-2 rounded-lg">
                    <QRCode value={upiUri} size={200} />
                  </div>
                  <p className="text-2xl font-bold">Amount: ₹{(amount / 100).toFixed(2)}</p>
                  <div className="mt-2">
                    <button onClick={handleCopyUpi} className="text-sm text-blue-600 hover:underline">
                      Copy UPI Link
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  {!showConfirmForm ? (
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 focus:outline-none"
                        onClick={() => onClose('cancelled')}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
                        onClick={() => setShowConfirmForm(true)}
                      >
                        I Have Paid
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit(onConfirmSubmit)}>
                      <h4 className="font-semibold">Confirm Your Payment</h4>
                      <p className="text-sm text-gray-500 mb-2">
                        Enter your UPI transaction reference ID (optional) to help the owner verify your payment faster.
                      </p>
                      <div>
                        <label htmlFor="upiReference" className="sr-only">UPI Reference ID</label>
                        <input
                          id="upiReference"
                          type="text"
                          {...register('upiReference')}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="e.g., 412345678901"
                        />
                        {errors.upiReference && <p className="text-red-500 text-xs mt-1">{errors.upiReference.message}</p>}
                      </div>
                      <div className="mt-4 flex space-x-4">
                        <button
                          type="button"
                          className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
                          onClick={() => setShowConfirmForm(false)}
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-green-300"
                        >
                          {isSubmitting ? 'Confirming...' : 'Confirm Payment'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}