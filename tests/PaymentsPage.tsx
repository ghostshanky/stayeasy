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
        {/* ... (Modal backdrop and panel structure similar to PaymentModal) ... */}
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
```

### 4. Router and Global Setup

You need to add the new page to your router and set up the toast provider.

#### `src/App.tsx` (or your main router file)

Make sure to add the `Toaster` component and the new route for the owner's payment page.

```diff
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -1,10 +1,13 @@
 import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
 import { Toaster } from 'react-hot-toast';
 import HomePage from './pages/HomePage';
 import OwnerDashboard from './pages/OwnerDashboard';
+import OwnerPaymentsPage from './pages/owner/PaymentsPage'; // Import the new page
 // ... other imports
 
 function App() {
   return (
     <>
+      <Toaster position="top-center" reverseOrder={false} />
       <Router>
         <Routes>
           <Route path="/" element={<HomePage />} />
@@ -13,6 +16,7 @@
           {/* Other routes */}
           <Route path="/owner/dashboard" element={<OwnerDashboard />} />
           {/* Add the new route for owner payments */}
+          <Route path="/owner/payments" element={<OwnerPaymentsPage />} /> 
         </Routes>
       </Router>
     </>
```

### 5. Fixing Broken Links

As requested, you need to replace placeholder `href` attributes. Here's an example of how you would do this in a component like a navigation bar.

**Example: `src/components/Navbar.tsx`**

```diff
--- a/src/components/Navbar.tsx
+++ b/src/components/Navbar.tsx
@@ -1,5 +1,5 @@
-import React from 'react';
+import { Link } from 'react-router-dom';
 
 export default function Navbar() {
   const isLoggedIn = !!localStorage.getItem('authToken');
@@ -10,11 +10,11 @@
     <nav className="bg-white shadow-md">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex justify-between h-16">
-          <a href="/" className="flex-shrink-0 flex items-center">
+          <Link to="/" className="flex-shrink-0 flex items-center">
             <span className="font-bold text-xl">StayEasy</span>
-          </a>
+          </Link>
           <div className="flex">
             {isLoggedIn ? (
               <div className="ml-6 flex items-center space-x-4">
@@ -22,11 +22,11 @@
                   // This should be a proper logout handler
                   onClick={handleLogout}
                   className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
-                >Logout</a>
-                <a href="/owner/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
+                >Logout</button>
+                <Link to="/owner/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                   Dashboard
-                </a>
+                </Link>
               </div>
             ) : (
               <div className="ml-6 flex items-center space-x-4">
@@ -34,10 +34,10 @@
                   // These should link to your login/signup pages
                   // Assuming you have routes for them
                 }
-                <a href="/login" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Login</a>
-                <a href="/signup" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Sign Up</a>
+                <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Login</Link>
+                <Link to="/signup" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Sign Up</Link>
               </div>
             )}
           </div>
```

### Integration Guide

1.  **Place the Files**:
    *   `apiClient.ts` -> `src/api/apiClient.ts`
    *   `PaymentModal.tsx` -> `src/components/payments/PaymentModal.tsx` (create folders if they don't exist).
    *   `PaymentsPage.tsx` -> `src/pages/owner/PaymentsPage.tsx` (create folders if they don't exist).

2.  **Update `App.tsx`**: Apply the changes to your main router file as shown above to register the new route and the `Toaster` component.

3.  **Trigger the Tenant Payment Modal**: In your "Book Property" flow (e.g., inside a `PropertyDetailsPage.tsx`), after the user clicks "Book Now" and you get a successful response from your booking creation endpoint, you will then call the `/api/payments/create` endpoint.

    *   **Example inside your booking component:**

    ```tsx
    import { useState } from 'react';
    import PaymentModal from '../components/payments/PaymentModal';
    import apiClient from '../api/apiClient';
    import toast from 'react-hot-toast';

    // ... inside your component
    const [paymentDetails, setPaymentDetails] = useState(null);

    const handleCreatePayment = async (bookingId: string) => {
      const toastId = toast.loading('Initiating payment...');
      try {
        const response = await apiClient.post('/payments/create', { bookingId });
        setPaymentDetails(response.data.data);
        toast.success('Payment initiated!', { id: toastId });
      } catch (error) {
        toast.error('Failed to initiate payment.', { id: toastId });
      }
    };

    // After successful booking...
    // handleCreatePayment(newBooking.id);

    return (
      <>
        {/* Your page content */}
        {paymentDetails && (
          <PaymentModal
            isOpen={!!paymentDetails}
            onClose={(status) => {
              setPaymentDetails(null);
              if (status === 'confirmed') {
                // Optionally navigate the user or show a success message
                // e.g., navigate('/my-bookings');
              }
            }}
            paymentId={paymentDetails.paymentId}
            upiUri={paymentDetails.upiUri}
            qrDataUrl={paymentDetails.qrDataUrl}
            amount={paymentDetails.amount} // Make sure your backend returns this
          />
        )}
      </>
    );
    ```

4.  **Link to Owner Payments Page**: In your `OwnerDashboard.tsx` or a sidebar for owners, add a `Link` from `react-router-dom` pointing to the new page.

    ```tsx
    import { Link } from 'react-router-dom';

    // ... inside owner dashboard component
    <Link to="/owner/payments" className="text-blue-600 hover:underline">
      View Pending Verifications
    </Link>
    ```

This completes the frontend implementation, providing a secure and user-friendly payment experience that is tightly integrated with the backend you've built.

<!--
[PROMPT_SUGGESTION]How can I add real-time updates to the owner's payment page using WebSockets?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]Create a "My Bookings" page for tenants to view their booking status and payment history.[/PROMPT_SUGGESTION]
-->