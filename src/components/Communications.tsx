import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Send, Mail, CheckCircle, Clock, User } from 'lucide-react';
import type { DocumentMatch, Communication } from '../types';

export const Communications: React.FC = () => {
  const { user, sendVerificationCode, verifyEmail } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (user) {
      loadMatches();
    }
  }, [user]);

  useEffect(() => {
    if (selectedMatch) {
      loadCommunications(selectedMatch.id);
    }
  }, [selectedMatch]);

  const loadMatches = async () => {
    try {
      const { data } = await supabase
        .from('document_matches')
        .select(`
          *,
          lost_documents(*),
          found_documents(*)
        `)
        .or(`lost_documents.user_id.eq.${user!.id},found_documents.finder_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });

      setMatches(data || []);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunications = async (matchId: string) => {
    try {
      const { data } = await supabase
        .from('communications')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      setCommunications(data || []);
    } catch (error) {
      console.error('Error loading communications:', error);
    }
  };

  const handleVerifyForCommunication = async () => {
    if (!verificationCode) return;

    const success = await verifyEmail(verificationEmail, verificationCode);
    if (success) {
      // Update match status to verified
      if (selectedMatch) {
        await supabase
          .from('document_matches')
          .update({ status: 'verified' })
          .eq('id', selectedMatch.id);
        
        loadMatches();
      }
      setShowEmailForm(false);
      setEmailSent(false);
      setVerificationEmail('');
      setVerificationCode('');
    }
  };

  const handleSendVerificationCode = async () => {
    const success = await sendVerificationCode(verificationEmail);
    if (success) {
      setEmailSent(true);
    }
  };

  const sendMessage = async () => {
    if (!selectedMatch || !newMessage.trim() || !user) return;

    setSendingMessage(true);
    try {
      // Determine receiver
      const isOwner = selectedMatch.lost_documents.user_id === user.id;
      const receiverId = isOwner ? selectedMatch.found_documents.finder_id : selectedMatch.lost_documents.user_id;

      const { error } = await supabase
        .from('communications')
        .insert([
          {
            match_id: selectedMatch.id,
            sender_id: user.id,
            receiver_id: receiverId,
            message: newMessage.trim()
          }
        ]);

      if (error) throw error;

      setNewMessage('');
      loadCommunications(selectedMatch.id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getOtherPartyName = (match: any) => {
    if (!user) return '';
    const isOwner = match.lost_documents.user_id === user.id;
    return isOwner ? 'Document Finder' : match.lost_documents.users?.full_name || 'Document Owner';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Matches List */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <MessageCircle className="h-5 w-5 text-purple-600 mr-2" />
            Document Matches
          </h2>
        </div>
        
        <div className="overflow-y-auto h-full">
          {matches.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No matches found yet. Keep checking back!
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {matches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className={`w-full p-4 text-left rounded-lg transition-colors duration-200 ${
                    selectedMatch?.id === match.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {match.lost_documents.document_type}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Match: {Math.round(match.similarity_score)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(match.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {match.status === 'verified' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Communication Area */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-lg flex flex-col">
        {selectedMatch ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Communication: {selectedMatch.lost_documents.document_type}
              </h3>
              <p className="text-sm text-gray-600">
                Chatting with {getOtherPartyName(selectedMatch)}
              </p>
              
              {selectedMatch.status === 'pending' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Email verification is required to start communication.
                  </p>
                  {!user?.is_verified && (
                    <button
                      onClick={() => setShowEmailForm(true)}
                      className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm transition-colors duration-200"
                    >
                      Verify Email to Communicate
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Email Verification Form */}
            {showEmailForm && (
              <div className="p-6 bg-blue-50 border-b border-blue-200">
                <h4 className="font-medium text-blue-900 mb-4">Email Verification Required</h4>
                <div className="space-y-4">
                  <div>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={verificationEmail}
                      onChange={(e) => setVerificationEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {!emailSent ? (
                    <button
                      onClick={handleSendVerificationCode}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Send Verification Code
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Enter 6-digit verification code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        maxLength={6}
                        className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleVerifyForCommunication}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                      >
                        Verify & Start Communication
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedMatch.status === 'verified' ? (
                <div className="space-y-4">
                  {communications.map((comm) => (
                    <div
                      key={comm.id}
                      className={`flex ${comm.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        comm.sender_id === user?.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        <p>{comm.message}</p>
                        <p className={`text-xs mt-1 ${
                          comm.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(comm.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Email verification required to view messages
                </div>
              )}
            </div>

            {/* Message Input */}
            {selectedMatch.status === 'verified' && (
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>Select a match to start communicating</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};