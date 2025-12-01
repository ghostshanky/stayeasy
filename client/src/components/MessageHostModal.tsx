import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/apiClient';
import toast from 'react-hot-toast';

interface MessageHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostName: string;
  hostId: string;
  propertyId?: string;
}

const MessageHostModal: React.FC<MessageHostModalProps> = ({ isOpen, onClose, hostName, hostId, propertyId }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !user) {
    return null;
  }

  const handleSendClick = async () => {
    if (!message.trim()) return;
    setIsSending(true);

    try {
      const response = await apiClient.post('/messages', {
        recipientId: hostId,
        content: message.trim(),
        propertyId: propertyId,
      });

      if (response.success) {
        // Close the modal and show success message
        onClose();
        toast.success('Message sent successfully!');
      } else {
        throw new Error(response.error?.message || 'Failed to send message');
      }
    } catch (error: any) {
      toast.error('Failed to send message. Please try again.');
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
      setMessage('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg w-full max-w-md m-4 p-6 flex flex-col gap-4 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Message {hostName}</h2>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={`Hi ${hostName}, I have a question about your place...`}
          className="w-full h-32 p-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark focus:ring-2 focus:ring-primary focus:outline-none text-sm"
          rows={5}
        />

        <button
          onClick={handleSendClick}
          disabled={isSending || !message.trim()}
          className="w-full flex items-center justify-center rounded-lg h-11 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            'Send Message'
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageHostModal;