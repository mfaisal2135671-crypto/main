import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Calendar, MapPin, Upload } from 'lucide-react';

export const UploadFound: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    documentType: '',
    documentNumber: '',
    holderName: '',
    issueDate: '',
    foundLocation: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const documentTypes = [
    'Aadhaar Card',
    'PAN Card',
    'Passport',
    'Driving License',
    'Voter ID',
    'Bank Passbook',
    'Insurance Policy',
    'Educational Certificate',
    'Birth Certificate',
    'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('found_documents')
        .insert([
          {
            finder_id: user.id,
            document_type: formData.documentType,
            document_number: formData.documentNumber,
            holder_name: formData.holderName,
            issue_date: formData.issueDate || null,
            found_location: formData.foundLocation || null,
            description: formData.description || null,
            status: 'active'
          }
        ]);

      if (error) throw error;

      setSuccess('Found document uploaded successfully! We will notify the owner if they have reported it lost.');
      setFormData({
        documentType: '',
        documentNumber: '',
        holderName: '',
        issueDate: '',
        foundLocation: '',
        description: ''
      });

      // Check for matches
      await checkForMatches();
    } catch (err) {
      setError('Failed to upload found document. Please try again.');
      console.error('Error uploading found document:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkForMatches = async () => {
    try {
      // Get all lost documents that might match
      const { data: lostDocs } = await supabase
        .from('lost_documents')
        .select('*')
        .eq('document_type', formData.documentType)
        .eq('status', 'active');

      if (lostDocs && lostDocs.length > 0) {
        for (const lostDoc of lostDocs) {
          let similarityScore = 0;

          // Calculate similarity based on document number
          if (lostDoc.document_number.toLowerCase() === formData.documentNumber.toLowerCase()) {
            similarityScore += 40;
          }

          // Calculate similarity based on holder name
          if (lostDoc.holder_name.toLowerCase().includes(formData.holderName.toLowerCase()) ||
              formData.holderName.toLowerCase().includes(lostDoc.holder_name.toLowerCase())) {
            similarityScore += 30;
          }

          // Calculate similarity based on issue date
          if (lostDoc.issue_date && formData.issueDate && lostDoc.issue_date === formData.issueDate) {
            similarityScore += 30;
          }

          // If similarity is high enough, create a match
          if (similarityScore >= 70) {
            const { data: foundDoc } = await supabase
              .from('found_documents')
              .select('id')
              .eq('finder_id', user!.id)
              .eq('document_number', formData.documentNumber)
              .single();

            if (foundDoc) {
              await supabase
                .from('document_matches')
                .insert([
                  {
                    lost_document_id: lostDoc.id,
                    found_document_id: foundDoc.id,
                    similarity_score: similarityScore,
                    status: 'pending'
                  }
                ]);

              // Update document statuses
              await supabase
                .from('lost_documents')
                .update({ status: 'found' })
                .eq('id', lostDoc.id);

              await supabase
                .from('found_documents')
                .update({ status: 'matched' })
                .eq('id', foundDoc.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking for matches:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Upload className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Upload Found Document</h2>
          <p className="mt-2 text-gray-600">
            Help reunite lost documents with their owners by uploading details of found documents
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type *
            </label>
            <select
              name="documentType"
              value={formData.documentType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
              required
            >
              <option value="">Select document type</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Number *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleInputChange}
                placeholder="Enter document number"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Holder Name *
            </label>
            <input
              type="text"
              name="holderName"
              value={formData.holderName}
              onChange={handleInputChange}
              placeholder="Name as on document"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Date (if visible)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Found Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="foundLocation"
                value={formData.foundLocation}
                onChange={handleInputChange}
                placeholder="Where did you find it?"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Any additional details about the document or where you found it"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-colors duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            {loading ? 'Uploading...' : 'Upload Found Document'}
          </button>
        </form>
      </div>
    </div>
  );
};