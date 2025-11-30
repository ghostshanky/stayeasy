import React from 'react';
import { Listing, ListingStatus } from '../../types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../client/src/lib/supabase';

interface ActionButtonProps {
    icon: string;
    label: string;
    onClick: () => void;
    colorClass?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, colorClass = 'hover:text-primary' }) => (
    <button 
        aria-label={label} 
        onClick={onClick}
        className={`p-2 rounded-md hover:bg-primary/10 text-text-light-secondary dark:text-text-dark-secondary ${colorClass} transition-colors duration-200`}
    >
        <span className="material-symbols-outlined text-xl">{icon}</span>
    </button>
);

interface ListingActionsProps {
    listingId: string | number;
    status: ListingStatus;
    onEdit: (id: string | number) => void;
    onDelete: (id: string | number) => void;
    onToggleStatus: (id: string | number) => void;
}

const ListingActions: React.FC<ListingActionsProps> = ({ listingId, status, onEdit, onDelete, onToggleStatus }) => {
    const isListed = status === ListingStatus.Listed;
    return (
        <div className="flex items-center justify-center gap-2">
            <ActionButton icon="edit" label="Edit Listing" onClick={() => onEdit(listingId)} />
            {isListed ? (
                <ActionButton icon="toggle_off" label="Deactivate Listing" onClick={() => onToggleStatus(listingId)} colorClass="hover:text-error" />
            ) : (
                <ActionButton icon="toggle_on" label="Activate Listing" onClick={() => onToggleStatus(listingId)} colorClass="hover:text-success" />
            )}
            <ActionButton icon="delete" label="Delete Listing" onClick={() => onDelete(listingId)} colorClass="hover:text-error" />
        </div>
    );
};

interface ListingsTableProps {
    listings: Listing[];
    onEdit: (id: string | number) => void;
    onDelete: (id: string | number) => void;
    onToggleStatus: (id: string | number) => void;
}

const OwnerListingsTable: React.FC<ListingsTableProps> = ({ listings, onEdit, onDelete, onToggleStatus }) => {
    const navigate = useNavigate();

    const handleAddNew = () => {
        navigate('/owner/add-property');
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-text-light-primary dark:text-text-dark-primary text-xl font-bold leading-tight tracking-tight">My Listings</h2>
                <div className="flex gap-2">
                    <div className="w-full sm:w-72">
                        <label className="relative flex items-center h-11 w-full">
                            <span className="material-symbols-outlined absolute left-4 text-xl text-text-light-secondary dark:text-text-dark-secondary">search</span>
                            <input
                                className="form-input w-full h-full pl-12 pr-4 rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary text-sm"
                                placeholder="Search listings..."
                            />
                        </label>
                    </div>
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined">add</span>
                        <span>Add Property</span>
                    </button>
                </div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-light-secondary dark:text-text-dark-secondary uppercase bg-background-light dark:bg-background-dark">
                        <tr>
                            <th scope="col" className="px-6 py-4 font-semibold">Property</th>
                            <th scope="col" className="px-6 py-4 font-semibold">Location</th>
                            <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                            <th scope="col" className="px-6 py-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listings.map((listing) => (
                            <tr key={listing.id} className="border-b border-border-light dark:border-border-dark last:border-b-0">
                                <td className="px-6 py-4 font-medium text-text-light-primary dark:text-text-dark-primary whitespace-nowrap">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-20 h-14 rounded-lg bg-cover bg-center"
                                            style={{ backgroundImage: `url(${listing.imageUrl})` }}
                                            role="img"
                                            aria-label={listing.name}
                                        ></div>
                                        <div className="flex flex-col">
                                            <span className="font-bold">{listing.name}</span>
                                            <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">{listing.details}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-text-light-secondary dark:text-text-dark-secondary">{listing.location}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${listing.status === ListingStatus.Listed ? 'bg-success/10 text-success' : 'bg-text-light-secondary/10 text-text-light-secondary dark:bg-text-dark-secondary/10 dark:text-text-dark-secondary'}`}>
                                        {listing.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <ListingActions 
                                        listingId={listing.id} 
                                        status={listing.status} 
                                        onEdit={onEdit} 
                                        onDelete={onDelete} 
                                        onToggleStatus={onToggleStatus} 
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OwnerListingsTable;