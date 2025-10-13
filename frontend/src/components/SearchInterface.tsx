
import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchInterfaceProps {
  onSearch: (topic: string) => void;
}

const SearchInterface: React.FC<SearchInterfaceProps> = ({ onSearch }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSearch(topic.trim());
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-2xl mx-auto text-center animate-fade-in">
        {/* Main Search Box */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative group">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a research topic to analyze..."
              className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg focus:border-blue-500 focus:outline-none focus:shadow-xl transition-all duration-300 group-hover:shadow-xl pr-14"
              autoFocus
            />
            <button
              type="submit"
              disabled={!topic.trim()}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
            >
              <Search size={20} />
            </button>
          </div>
        </form>

        {/* Subtitle */}
        <p className="text-xl text-gray-600 mb-8 font-light">
          AI-Powered Research Discovery
        </p>

        {/* Sample Topics */}
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-4">Try these topics:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'Quantum Computing',
              'CRISPR Gene Editing',
              'Renewable Energy Storage',
              'Artificial Neural Networks',
              'Climate Change Mitigation'
            ].map((sampleTopic) => (
              <button
                key={sampleTopic}
                onClick={() => setTopic(sampleTopic)}
                className="px-4 py-2 text-sm bg-white/60 backdrop-blur-sm border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:scale-105"
              >
                {sampleTopic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchInterface;
