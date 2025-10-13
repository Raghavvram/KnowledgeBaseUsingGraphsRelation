import React, { useState } from 'react';
import { BarChart3, Share2, Lightbulb, MessageCircle, FileText, Send, Bot, User, Download, Eye, Edit, BookOpen, Brain, Zap } from 'lucide-react';
import OverviewTab from './tabs/OverviewTab';
import KnowledgeMapTab from './tabs/KnowledgeMapTab';
import InsightsTab from './tabs/InsightsTab';
import ChatTab from './tabs/ChatTab'; 
import { ResultsData } from '../types/research';
import ResearchPaperGenerator from './ResearchPaperGenerator';

// ... other imports




interface ResultsTabsProps {
  data: ResultsData;
  topic: string;
}

const ResultsTabs: React.FC<ResultsTabsProps> = ({ data, topic }) => {
  const [activeTab, setActiveTab] = useState('knowledge-map');

  const tabs = [
    {
      id: 'knowledge-map',
      label: 'Knowledge Map',
      icon: Share2,
      component: KnowledgeMapTab
    },
    {
      id: 'chat',
      label: 'Research Assistant',
      icon: MessageCircle,
      component: ChatTab,
      highlight: true
    },
    {
      id: 'paper-generator',
      label: 'Generate Paper',
      icon: FileText,
      component: ResearchPaperGenerator,
      highlight: true
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || OverviewTab;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="flex space-x-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        <ActiveComponent data={data} topic={topic} />
      </div>
    </div>
  );
};

export default ResultsTabs;