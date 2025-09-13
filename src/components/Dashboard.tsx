import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileSearch, Upload, MessageCircle, CheckCircle, AlertCircle, Calendar, ExternalLink, Gift, Award, ShoppingBag } from 'lucide-react';
import type { LostDocument, FoundDocument, DocumentMatch } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [lostDocs, setLostDocs] = useState<LostDocument[]>([]);
  const [foundDocs, setFoundDocs] = useState<FoundDocument[]>([]);
  const [matches, setMatches] = useState<DocumentMatch[]>([]);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadRewardPoints();
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

  const loadRewardPoints = async () => {
    try {
      // Calculate reward points based on successful matches as finder
      const { data: successfulMatches } = await supabase
        .from('document_matches')
        .select(`
          *,
          found_documents!inner(finder_id)
        `)
        .eq('found_documents.finder_id', user!.id)
        .in('status', ['verified', 'completed']);

      const points = (successfulMatches?.length || 0) * 100; // 100 points per successful match
      setRewardPoints(points);
    } catch (error) {
      console.error('Error loading reward points:', error);
    }
  };

  const governmentLinks = [
    {
      name: 'Aadhaar - UIDAI',
      url: 'https://uidai.gov.in/',
      description: 'Official Aadhaar services and updates',
      icon: '🆔'
    },
    {
      name: 'PAN - Income Tax Department',
      url: 'https://www.incometax.gov.in/iec/foportal/',
      description: 'PAN card services and tax information',
      icon: '💳'
    },
    {
      name: 'Passport Seva',
      url: 'https://www.passportindia.gov.in/',
      description: 'Passport application and services',
      icon: '📘'
    },
    {
      name: 'Driving License - Parivahan',
      url: 'https://parivahan.gov.in/parivahan/',
      description: 'Driving license and vehicle registration',
      icon: '🚗'
    },
    {
      name: 'Voter ID - Election Commission',
      url: 'https://www.nvsp.in/',
      description: 'Voter registration and services',
      icon: '🗳️'
    }
  ];

  const rewards = [
    {
      name: 'Amazon',
      discount: '10% Off',
      points: 500,
      description: 'Get 10% discount on Amazon purchases',
      color: 'bg-orange-100 text-orange-800'
    },
    {
      name: 'Flipkart',
      discount: '15% Off',
      points: 750,
      description: 'Get 15% discount on Flipkart orders',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      name: 'Myntra',
      discount: '20% Off',
      points: 1000,
      description: 'Get 20% discount on fashion items',
      color: 'bg-pink-100 text-pink-800'
    },
    {
      name: 'Zomato',
      discount: '25% Off',
      points: 300,
      description: 'Get 25% discount on food orders',
      color: 'bg-red-100 text-red-800'
    },
    {
      name: 'BookMyShow',
      discount: '₹100 Off',
      points: 400,
      description: 'Get ₹100 off on movie tickets',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      name: 'Uber',
      discount: '30% Off',
      points: 600,
      description: 'Get 30% discount on rides',
      color: 'bg-green-100 text-green-800'
    }
  ];
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

      {/* Reward Points Section */}
      {foundDocs.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-8 border border-yellow-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Award className="h-6 w-6 text-yellow-600 mr-2" />
                Reward Points
              </h2>
              <p className="text-gray-600">Earn points by helping others find their documents!</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-600">{rewardPoints}</div>
              <div className="text-sm text-gray-600">Points Available</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{reward.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${reward.color}`}>
                    {reward.discount}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{reward.points} points</span>
                  <button
                    disabled={rewardPoints < reward.points}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200 ${
                      rewardPoints >= reward.points
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {rewardPoints >= reward.points ? 'Redeem' : 'Need More'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Government Links Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <ExternalLink className="h-6 w-6 text-blue-600 mr-2" />
          Government Document Services
        </h2>
        <p className="text-gray-600 mb-6">
          Quick access to official government websites for document services and applications
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {governmentLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-start space-x-4">
                <div className="text-2xl">{link.icon}</div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                    {link.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                  <div className="flex items-center mt-2 text-blue-600 text-sm">
                    <span>Visit Website</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
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