import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileSearch, Upload, MessageCircle, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import type { LostDocument, FoundDocument, DocumentMatch } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [lostDocs, setLostDocs] = useState<LostDocument[]>([]);
  const [foundDocs, setFoundDocs] = useState<FoundDocument[]>([]);
  const [matches, setMatches] = useState<DocumentMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load lost documents
      const { data: lostData } = await supabase
        .from('lost_documents')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      // Load found documents
      const { data: foundData } = await supabase
        .from('found_documents')
        .select('*')
        .eq('finder_id', user!.id)
        .order('created_at', { ascending: false });

      // Load matches
      const { data: matchData } = await supabase
        .from('document_matches')
        .select(`
          *,
          lost_documents(*),
          found_documents(*)
        `)
        .or(`lost_documents.user_id.eq.${user!.id},found_documents.finder_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });

      setLostDocs(lostData || []);
      setFoundDocs(foundData || []);
      setMatches(matchData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Lost Documents Reported',
      value: lostDocs.length,
      icon: FileSearch,
      color: 'text-red-600 bg-red-100',
    },
    {
      label: 'Found Documents Uploaded',
      value: foundDocs.length,
      icon: Upload,
      color: 'text-green-600 bg-green-100',
    },
    {
      label: 'Matches Found',
      value: matches.length,
      icon: CheckCircle,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: 'Active Communications',
      value: matches.filter(m => m.status === 'verified').length,
      icon: MessageCircle,
      color: 'text-purple-600 bg-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {user?.full_name}! Here's an overview of your document activities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Lost Documents */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            Recent Lost Documents
          </h2>
          {lostDocs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No lost documents reported yet</p>
          ) : (
            <div className="space-y-4">
              {lostDocs.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.document_type}</h3>
                      <p className="text-sm text-gray-600">
                        Holder: {doc.holder_name}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      doc.status === 'found' 
                        ? 'bg-green-100 text-green-800' 
                        : doc.status === 'resolved'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Found Documents */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            Recent Found Documents
          </h2>
          {foundDocs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No found documents uploaded yet</p>
          ) : (
            <div className="space-y-4">
              {foundDocs.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.document_type}</h3>
                      <p className="text-sm text-gray-600">
                        Holder: {doc.holder_name}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      doc.status === 'matched' 
                        ? 'bg-blue-100 text-blue-800' 
                        : doc.status === 'returned'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Matches */}
      {matches.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <MessageCircle className="h-5 w-5 text-purple-600 mr-2" />
            Recent Matches
          </h2>
          <div className="space-y-4">
            {matches.slice(0, 3).map((match) => (
              <div
                key={match.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Document Match Found!
                    </h3>
                    <p className="text-sm text-gray-600">
                      Similarity: {Math.round(match.similarity_score)}%
                    </p>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(match.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    match.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : match.status === 'verified'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {match.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};