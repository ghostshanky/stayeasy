import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import OwnerSideNavBar from '../components/owner/OwnerSideNavBar';
import OwnerHeader from '../components/owner/OwnerHeader';
import OwnerMessagesList from '../components/owner/OwnerMessagesList';
import { useNavigate } from 'react-router-dom';

const OwnerMessagesPage = ({ navigate: pageNavigate }: { navigate: (page: Page) => void }) => {
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
  };

  const handleSendMessage = async (conversationId: string, message: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        // Refresh messages
        window.location.reload();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="flex bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
      <OwnerSideNavBar onNavigate={pageNavigate} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          <OwnerHeader userName="Alex" />
          
          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div className="w-1/3 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Messages</h2>
              <OwnerMessagesList 
                onConversationSelect={handleConversationSelect}
                selectedConversation={selectedConversation}
              />
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              {selectedConversation ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    {/* Messages would be displayed here */}
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <p>Chat interface would be implemented here</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            handleSendMessage(selectedConversation, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input.value.trim()) {
                            handleSendMessage(selectedConversation, input.value);
                            input.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerMessagesPage;