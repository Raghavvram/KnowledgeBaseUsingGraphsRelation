
import React, { useState } from 'react';
import { FileText, Download, Share2 } from 'lucide-react';

interface FloatingActionButtonProps {
  topic: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ topic }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    
    // Simulate draft generation
    setTimeout(() => {
      setIsGenerating(false);
      setShowDraftModal(true);
    }, 3000);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleGenerateDraft}
        disabled={isGenerating}
        className="fixed bottom-24 right-8 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-50"
      >
        {isGenerating ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        ) : (
          <FileText size={24} />
        )}
      </button>

      {/* Draft Generation Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto animate-scale-in">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Research Draft Generated
                </h2>
                <button
                  onClick={() => setShowDraftModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Draft Content */}
              <div className="prose max-w-none">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                  Research Analysis: {topic}
                </h1>
                
                <h2 className="text-xl font-semibold text-gray-700 mb-3 mt-6">
                  Executive Summary
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Quantum computing represents a paradigm shift in computational capability, leveraging quantum 
                  mechanical phenomena to process information in ways impossible for classical computers. Our 
                  analysis of 127 recent papers reveals significant progress in error correction, hardware 
                  development, and practical applications.
                </p>

                <h2 className="text-xl font-semibold text-gray-700 mb-3 mt-6">
                  Key Findings
                </h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Error correction research has accelerated by 340% in the past two years</li>
                  <li>Commercial applications are emerging in cryptography and drug discovery</li>
                  <li>Hardware scaling remains a primary technical challenge</li>
                  <li>Industry leaders continue to invest heavily in quantum technologies</li>
                </ul>

                <h2 className="text-xl font-semibold text-gray-700 mb-3 mt-6">
                  Research Methodology
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  This analysis utilized AI-powered knowledge graph construction to identify patterns 
                  across 127 academic papers from 89 leading researchers. The methodology included 
                  semantic analysis, citation network mapping, and trend identification algorithms.
                </p>

                <h2 className="text-xl font-semibold text-gray-700 mb-3 mt-6">
                  Future Implications
                </h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Based on current research trajectories, quantum advantage in specific use cases 
                  is projected within 3-5 years, with broader commercial applications following in 
                  the subsequent decade. Continued investment in error correction and hardware 
                  development will be critical for realizing this potential.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                  <Download size={18} />
                  <span>Download PDF</span>
                </button>
                <button className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                  <Share2 size={18} />
                  <span>Share Draft</span>
                </button>
                <button 
                  onClick={() => setShowDraftModal(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingActionButton;
