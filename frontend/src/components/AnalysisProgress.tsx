
import React from 'react';
import { Search, Lightbulb, Layers } from 'lucide-react';
import { AnalysisState } from '../types/research';

interface AnalysisProgressProps {
  state: AnalysisState;
  topic: string;
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ state, topic }) => {
  const steps = [
    { id: 'analyzing', icon: Search, label: 'Finding papers', description: 'Searching academic databases' },
    { id: 'building-graph', icon: Layers, label: 'Building knowledge graph', description: 'Mapping connections and relationships' },
    { id: 'generating-insights', icon: Lightbulb, label: 'Generating insights', description: 'AI analysis and synthesis' }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === state);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-2xl mx-auto text-center animate-fade-in">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Analyzing research landscape for
          </h1>
          <h2 className="text-3xl font-bold text-blue-600 mb-6">
            "{topic}"
          </h2>
          <p className="text-gray-600">
            This usually takes 30-60 seconds
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-8 mb-12">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const IconComponent = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-500 ${
                  isActive 
                    ? 'bg-blue-50 border-2 border-blue-200 scale-105' 
                    : isCompleted 
                    ? 'bg-green-50 border-2 border-green-200' 
                    : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                <div className={`p-3 rounded-full ${
                  isActive 
                    ? 'bg-blue-500 animate-pulse' 
                    : isCompleted 
                    ? 'bg-green-500' 
                    : 'bg-gray-400'
                }`}>
                  <IconComponent className="text-white" size={24} />
                </div>
                <div className="text-left">
                  <h3 className={`font-semibold ${
                    isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {step.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {step.description}
                  </p>
                </div>
                {isActive && (
                  <div className="ml-auto">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                )}
                {isCompleted && (
                  <div className="ml-auto">
                    <div className="text-green-500 text-xl">✓</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
      </div>
    </div>
  );
};

export default AnalysisProgress;
