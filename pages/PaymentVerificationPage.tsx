import React from 'react';
import { Page } from '../types';
import { OwnerDashboard } from '../client/owner-dashboard';

const PaymentVerificationPage = ({ navigate }: { navigate: (page: Page) => void }) => {
    // In a real app, you'd get the owner ID from authentication context
    const ownerId = "current-owner-id";

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => navigate('ownerDashboard')}
                        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Dashboard
                    </button>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
                        Payment Verification
                    </h1>
                    <p className="text-text-light-secondary dark:text-text-dark-secondary mt-2">
                        Review and verify tenant payments for your properties
                    </p>
                </div>

                <OwnerDashboard ownerId={ownerId} />
            </div>
        </div>
    );
};

export default PaymentVerificationPage;
