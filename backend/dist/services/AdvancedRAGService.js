"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedRAGService = void 0;
// AdvancedRAGService.ts - Multi-Step Research Reasoning
const neo4jService_1 = __importDefault(require("./neo4jService"));
const graphRagService_1 = require("./graphRagService");
const groqService_1 = require("./groqService");
class AdvancedRAGService extends graphRagService_1.GraphRAGService {
    // ✅ MULTI-STEP RESEARCH REASONING
    async conductResearchInvestigation(question, topic) {
        try {
            console.log(`🧪 Starting multi-step research investigation: "${question}"`);
            // Step 1: Break down the complex question into research steps
            const researchPlan = await this.createResearchPlan(question);
            console.log(`🗂 Research plan created with ${researchPlan.steps.length} steps`);
            // Step 2: Execute each research step
            const executedSteps = [];
            let allSources = [];
            for (let i = 0; i < researchPlan.steps.length; i++) {
                const step = researchPlan.steps[i];
                console.log(`🔍 Executing step ${i + 1}: ${step.question}`);
                const stepResult = await this.executeResearchStep(step, executedSteps, topic);
                executedSteps.push(stepResult);
                allSources.push(...stepResult.findings);
                // Brief pause between steps
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            // Step 3: Synthesize findings across all steps
            const synthesis = await this.synthesizeFindings(question, executedSteps);
            // Step 4: Generate conclusions and identify gaps
            const analysis = await this.analyzeResearchGaps(question, executedSteps, synthesis);
            return {
                originalQuestion: question,
                steps: executedSteps,
                synthesis: synthesis.synthesis,
                conclusions: synthesis.conclusions,
                limitationsAndGaps: analysis.limitations,
                suggestedResearch: analysis.futureResearch,
                sources: this.deduplicateSources(allSources),
                totalConfidence: this.calculateOverallConfidence(executedSteps)
            };
        }
        catch (error) {
            console.error('❌ Error in multi-step research investigation:', error);
            throw error;
        }
    }
    // Create a research plan by breaking down complex questions
    async createResearchPlan(question) {
        const planningPrompt = `
You are a research methodology expert. Break down this complex research question into 3-5 specific, actionable research steps.

Research Question: "${question}"

Create a systematic investigation plan. Each step should:
1. Focus on one specific aspect of the question
2. Build logically on previous steps
3. Be answerable with academic literature
4. Lead toward answering the main question

Provide JSON response:
{
  "steps": [
    {
      "question": "Specific research question for this step",
      "reasoning": "Why this step is important for the overall investigation"
    }
  ]
}

Make each step concrete and searchable in academic databases.
`;
        try {
            const response = await groqService_1.groqService.generateCompletion(planningPrompt, {
                maxTokens: 600,
                temperature: 0.2
            });
            const plan = JSON.parse(response);
            return {
                steps: plan.steps?.slice(0, 5) || [
                    { question: question, reasoning: "Direct investigation of the main question" }
                ]
            };
        }
        catch (error) {
            console.warn('⚠️ Research planning failed, using simple approach:', error);
            return {
                steps: [
                    { question: question, reasoning: "Direct investigation of the main question" }
                ]
            };
        }
    }
    // Execute a single research step
    async executeResearchStep(step, previousSteps, topic) {
        // Build context from previous steps
        const previousContext = previousSteps.map(s => `${s.question}: ${s.findings.slice(0, 2).map(f => f.title).join(', ')}`).join('\n');
        // Search for relevant papers using hybrid search
        const searchResults = await neo4jService_1.default.hybridSearch(step.question, 8, topic);
        // Get full content for top papers
        const papersWithContent = await this.getPapersFullContent(searchResults.combinedResults.slice(0, 5));
        // Extract and analyze relevant passages
        const relevantPassages = await this.extractRelevantPassages(papersWithContent, step.question);
        // Generate step-specific findings
        const findings = await this.analyzeStepFindings(step, relevantPassages, previousContext);
        return {
            id: `step-${Date.now()}`,
            question: step.question,
            reasoning: step.reasoning,
            findings: papersWithContent,
            confidence: this.calculateStepConfidence(papersWithContent, relevantPassages),
            nextSteps: findings.nextSteps || []
        };
    }
    // Analyze findings for a specific research step
    async analyzeStepFindings(step, passages, previousContext) {
        const contextText = passages.map((passage, index) => `[Source ${index + 1}]: ${passage.content}`).join('\n\n');
        const analysisPrompt = `
You are analyzing research findings for a specific step in a larger investigation.

RESEARCH STEP: ${step.question}
REASONING: ${step.reasoning}

PREVIOUS STEPS CONTEXT:
${previousContext}

CURRENT FINDINGS:
${contextText}

Provide a focused analysis for this research step:

1. What does the evidence show about this specific research question?
2. How do these findings relate to the previous steps?
3. What are the key insights and patterns?
4. What questions emerge for further investigation?

Provide JSON response:
{
  "analysis": "Detailed analysis of the findings for this step",
  "nextSteps": ["Specific follow-up questions or areas to explore"]
}

Focus on evidence-based conclusions and be specific about what the research shows.
`;
        try {
            const response = await groqService_1.groqService.generateCompletion(analysisPrompt, {
                maxTokens: 500,
                temperature: 0.3
            });
            return JSON.parse(response);
        }
        catch (error) {
            console.warn('⚠️ Step analysis failed:', error);
            return {
                analysis: `Analysis of findings related to: ${step.question}`,
                nextSteps: ['Continue investigation with additional sources']
            };
        }
    }
    // Synthesize findings across all research steps
    async synthesizeFindings(originalQuestion, steps) {
        const stepSummaries = steps.map((step, index) => `Step ${index + 1}: ${step.question}\nKey papers: ${step.findings.slice(0, 3).map(f => f.title).join(', ')}\nConfidence: ${step.confidence}%`).join('\n\n');
        const synthesisPrompt = `
You are synthesizing findings from a multi-step research investigation.

ORIGINAL RESEARCH QUESTION: "${originalQuestion}"

RESEARCH STEPS COMPLETED:
${stepSummaries}

Based on all the research steps and findings, provide a comprehensive synthesis:

1. How do the findings from different steps connect and support each other?
2. What is the overall picture that emerges from this investigation?
3. What are the most important conclusions supported by the evidence?
4. How well does this research answer the original question?

Provide JSON response:
{
  "synthesis": "Comprehensive synthesis connecting all research steps and findings",
  "conclusions": [
    "Key conclusion 1 based on evidence",
    "Key conclusion 2 based on evidence",
    "Key conclusion 3 based on evidence"
  ]
}

Focus on evidence-based synthesis and clear conclusions.
`;
        try {
            const response = await groqService_1.groqService.generateCompletion(synthesisPrompt, {
                maxTokens: 800,
                temperature: 0.3
            });
            return JSON.parse(response);
        }
        catch (error) {
            console.warn('⚠️ Synthesis failed:', error);
            return {
                synthesis: `Research synthesis for: ${originalQuestion}`,
                conclusions: ['Investigation completed with multiple research steps']
            };
        }
    }
    // Analyze research gaps and limitations
    async analyzeResearchGaps(originalQuestion, steps, synthesis) {
        const gapAnalysisPrompt = `
Analyze this research investigation for limitations and future research opportunities.

ORIGINAL QUESTION: "${originalQuestion}"
SYNTHESIS: ${synthesis.synthesis}

RESEARCH STEPS CONFIDENCE:
${steps.map((s, i) => `Step ${i + 1}: ${s.confidence}% confidence`).join('\n')}

Identify:
1. What limitations exist in the current research findings?
2. What gaps remain unanswered?
3. What future research directions would be valuable?
4. What methodological improvements could strengthen the investigation?

Provide JSON response:
{
  "limitations": [
    "Specific limitation or constraint in the current research",
    "Another limitation or gap in the evidence"
  ],
  "futureResearch": [
    "Specific future research direction",
    "Another research opportunity or question"
  ]
}

Be specific and constructive in identifying limitations and opportunities.
`;
        try {
            const response = await groqService_1.groqService.generateCompletion(gapAnalysisPrompt, {
                maxTokens: 400,
                temperature: 0.4
            });
            return JSON.parse(response);
        }
        catch (error) {
            console.warn('⚠️ Gap analysis failed:', error);
            return {
                limitations: ['Limited scope of available research papers'],
                futureResearch: ['Further investigation with broader literature']
            };
        }
    }
    // ✅ RESEARCH SYNTHESIS - Combine multiple topics
    async synthesizeResearchTopics(topics, research_focus) {
        try {
            console.log(`🔄 Synthesizing research across topics: ${topics.join(', ')}`);
            // Search for papers across all topics
            const topicResults = await Promise.all(topics.map(topic => neo4jService_1.default.hybridSearch(topic, 5)));
            // Find intersection papers (papers that appear in multiple topic searches)
            const intersectionPapers = this.findTopicIntersections(topicResults, topics);
            // Analyze relationships between topics
            const topicAnalysis = await this.analyzeTopicRelationships(topics, intersectionPapers, research_focus);
            return {
                topics: topics,
                intersectionPapers: intersectionPapers,
                analysis: topicAnalysis,
                researchFocus: research_focus,
                recommendations: await this.generateSynthesisRecommendations(topics, topicAnalysis)
            };
        }
        catch (error) {
            console.error('❌ Error in research synthesis:', error);
            throw error;
        }
    }
    // Find papers that appear across multiple topic searches
    findTopicIntersections(topicResults, topics) {
        const paperCounts = new Map();
        topicResults.forEach((results, topicIndex) => {
            const topic = topics[topicIndex];
            results.combinedResults.forEach((paper) => {
                if (paperCounts.has(paper.id)) {
                    paperCounts.get(paper.id).topics.push(topic);
                }
                else {
                    paperCounts.set(paper.id, { paper, topics: [topic] });
                }
            });
        });
        // Return papers that appear in multiple topics
        return Array.from(paperCounts.values())
            .filter(item => item.topics.length > 1)
            .sort((a, b) => b.topics.length - a.topics.length)
            .map(item => ({
            ...item.paper,
            topicsFound: item.topics,
            intersectionScore: item.topics.length
        }));
    }
    // ✅ TEMPORAL RESEARCH ANALYSIS - Track trends over time
    async analyzeResearchTrends(topic, startYear, endYear) {
        try {
            const currentYear = new Date().getFullYear();
            const fromYear = startYear || currentYear - 5;
            const toYear = endYear || currentYear;
            console.log(`📈 Analyzing research trends for "${topic}" from ${fromYear} to ${toYear}`);
            // Get papers by year
            const yearlyData = await this.getPapersByYear(topic, fromYear, toYear);
            // Analyze trends
            const trendAnalysis = await this.analyzeTrendPatterns(yearlyData, topic);
            // Get emerging authors and concepts
            const emergingElements = await this.identifyEmergingElements(yearlyData);
            return {
                topic: topic,
                timeRange: { from: fromYear, to: toYear },
                yearlyBreakdown: yearlyData,
                trends: trendAnalysis,
                emergingAuthors: emergingElements.authors,
                emergingConcepts: emergingElements.concepts,
                keyDevelopments: trendAnalysis.keyDevelopments
            };
        }
        catch (error) {
            console.error('❌ Error in trend analysis:', error);
            throw error;
        }
    }
    // Get papers grouped by year
    async getPapersByYear(topic, fromYear, toYear) {
        try {
            // Get papers by topic first
            const papers = await neo4jService_1.default.getPapersByTopic(topic);
            // Group papers by year
            const yearlyData = papers
                .filter(paper => paper.year >= fromYear && paper.year <= toYear)
                .reduce((acc, paper) => {
                const year = paper.year;
                if (!acc[year]) {
                    acc[year] = {
                        year,
                        paperCount: 0,
                        sampleTitles: [],
                        avgCitations: 0,
                        topAuthors: []
                    };
                }
                acc[year].paperCount++;
                if (acc[year].sampleTitles.length < 3) {
                    acc[year].sampleTitles.push(paper.title);
                }
                acc[year].avgCitations = (acc[year].avgCitations * (acc[year].paperCount - 1) + (paper.citationCount || 0)) / acc[year].paperCount;
                if (paper.authors && paper.authors.length > 0 && acc[year].topAuthors.length < 5) {
                    acc[year].topAuthors.push(paper.authors[0]);
                }
                return acc;
            }, {});
            // Convert to array and sort by year
            return Object.values(yearlyData).sort((a, b) => a.year - b.year);
        }
        catch (error) {
            console.error('❌ Error getting papers by year:', error);
            return [];
        }
    }
    // Calculate step and overall confidence
    calculateStepConfidence(papers, passages) {
        if (papers.length === 0)
            return 0;
        const factors = {
            paperCount: Math.min(papers.length / 5, 1) * 30,
            contentQuality: papers.filter(p => p.hasFullContent).length / papers.length * 25,
            passageRelevance: passages.length > 0 ? passages.reduce((sum, p) => sum + p.relevance, 0) / passages.length * 30 : 0,
            citationStrength: papers.reduce((sum, p) => sum + (p.citationCount || 0), 0) / papers.length / 100 * 15
        };
        return Math.round(Object.values(factors).reduce((sum, val) => sum + val, 0));
    }
    calculateOverallConfidence(steps) {
        if (steps.length === 0)
            return 0;
        const avgStepConfidence = steps.reduce((sum, step) => sum + step.confidence, 0) / steps.length;
        const consistencyBonus = steps.length > 1 ? 10 : 0; // Bonus for multi-step analysis
        return Math.min(100, Math.round(avgStepConfidence + consistencyBonus));
    }
    // Remove duplicate sources across steps
    deduplicateSources(allSources) {
        const seen = new Set();
        return allSources.filter(source => {
            if (seen.has(source.id)) {
                return false;
            }
            seen.add(source.id);
            return true;
        });
    }
    // ✅ RESEARCH METHODOLOGY COMPARISON
    async compareResearchMethodologies(methodologies, researchArea) {
        try {
            console.log(`⚖️ Comparing methodologies: ${methodologies.join(' vs ')} in ${researchArea}`);
            const comparisons = [];
            for (const methodology of methodologies) {
                const query = `${methodology} methodology in ${researchArea}`;
                const results = await neo4jService_1.default.hybridSearch(query, 5);
                const analysis = await this.analyzeMethodology(methodology, results.combinedResults, researchArea);
                comparisons.push({
                    methodology: methodology,
                    papers: results.combinedResults,
                    analysis: analysis,
                    strengths: analysis.strengths,
                    limitations: analysis.limitations,
                    useCases: analysis.useCases
                });
            }
            // Generate comparative synthesis
            const synthesis = await this.synthesizeMethodologyComparison(comparisons, researchArea);
            return {
                researchArea: researchArea,
                methodologies: methodologies,
                comparisons: comparisons,
                synthesis: synthesis,
                recommendations: synthesis.recommendations
            };
        }
        catch (error) {
            console.error('❌ Error in methodology comparison:', error);
            throw error;
        }
    }
    async analyzeMethodology(methodology, papers, researchArea) {
        const paperTitles = papers.slice(0, 3).map(p => p.title).join(', ');
        const analysisPrompt = `
Analyze the ${methodology} methodology in ${researchArea} research based on these papers:

Papers: ${paperTitles}

Provide analysis in JSON format:
{
  "strengths": ["Key strength 1", "Key strength 2"],
  "limitations": ["Limitation 1", "Limitation 2"], 
  "useCases": ["Best use case 1", "Best use case 2"],
  "summary": "Brief summary of the methodology's role in this research area"
}
`;
        try {
            const response = await groqService_1.groqService.generateCompletion(analysisPrompt, {
                maxTokens: 300,
                temperature: 0.3
            });
            return JSON.parse(response);
        }
        catch (error) {
            return {
                strengths: [`${methodology} shows promise in ${researchArea}`],
                limitations: ['Limited analysis available'],
                useCases: [`Applied in ${researchArea} research`],
                summary: `${methodology} methodology analysis`
            };
        }
    }
    async synthesizeMethodologyComparison(comparisons, researchArea) {
        const methodologyNames = comparisons.map(c => c.methodology).join(', ');
        const synthesisPrompt = `
Compare these methodologies in ${researchArea}:

${comparisons.map(c => `${c.methodology}: ${c.analysis.summary}`).join('\n')}

Provide comparative synthesis in JSON:
{
  "summary": "Overall comparison summary",
  "recommendations": ["When to use methodology X", "When to use methodology Y"],
  "trends": "Current trends in methodology adoption"
}
`;
        try {
            const response = await groqService_1.groqService.generateCompletion(synthesisPrompt, {
                maxTokens: 400,
                temperature: 0.3
            });
            return JSON.parse(response);
        }
        catch (error) {
            return {
                summary: `Comparison of ${methodologyNames} in ${researchArea}`,
                recommendations: ['Further analysis needed'],
                trends: 'Mixed adoption across research communities'
            };
        }
    }
    // Add missing methods
    async analyzeTopicRelationships(topics, intersectionPapers, research_focus) {
        try {
            const prompt = `
Analyze the relationships between these research topics based on the papers that connect them:

Topics: ${topics.join(', ')}
${research_focus ? `Research Focus: ${research_focus}` : ''}

Provide JSON response:
{
  "relationships": [
    {
      "topics": ["topic1", "topic2"],
      "strength": 0.8,
      "description": "How these topics are related",
      "keyPapers": ["paper1", "paper2"]
    }
  ],
  "synthesis": "Overall analysis of topic relationships"
}`;
            const response = await groqService_1.groqService.generateCompletion(prompt, {
                maxTokens: 800,
                temperature: 0.3
            });
            return JSON.parse(response);
        }
        catch (error) {
            console.error('❌ Error analyzing topic relationships:', error);
            return {
                relationships: [],
                synthesis: "Unable to analyze topic relationships"
            };
        }
    }
    async generateSynthesisRecommendations(topics, topicAnalysis) {
        try {
            const prompt = `
Based on the analysis of these research topics:
${topics.join(', ')}

And their relationships:
${JSON.stringify(topicAnalysis, null, 2)}

Generate specific recommendations for:
1. Research directions
2. Potential collaborations
3. Knowledge gaps to address

Format as a JSON array of recommendation strings.`;
            const response = await groqService_1.groqService.generateCompletion(prompt, {
                maxTokens: 400,
                temperature: 0.4
            });
            return JSON.parse(response);
        }
        catch (error) {
            console.error('❌ Error generating synthesis recommendations:', error);
            return ["Further analysis needed for specific recommendations"];
        }
    }
    async analyzeTrendPatterns(yearlyData, topic) {
        try {
            const prompt = `
Analyze research trends for "${topic}" based on this yearly data:
${JSON.stringify(yearlyData, null, 2)}

Provide JSON response:
{
  "trends": [
    {
      "pattern": "Description of trend",
      "years": [2020, 2021, 2022],
      "significance": "Why this trend matters"
    }
  ],
  "keyDevelopments": ["Major developments in the field"],
  "futurePredictions": ["Predicted future directions"]
}`;
            const response = await groqService_1.groqService.generateCompletion(prompt, {
                maxTokens: 600,
                temperature: 0.3
            });
            return JSON.parse(response);
        }
        catch (error) {
            console.error('❌ Error analyzing trend patterns:', error);
            return {
                trends: [],
                keyDevelopments: [],
                futurePredictions: []
            };
        }
    }
    async identifyEmergingElements(yearlyData) {
        try {
            const prompt = `
Identify emerging authors and concepts from this research data:
${JSON.stringify(yearlyData, null, 2)}

Provide JSON response:
{
  "authors": ["List of emerging authors"],
  "concepts": ["List of emerging concepts"]
}`;
            const response = await groqService_1.groqService.generateCompletion(prompt, {
                maxTokens: 400,
                temperature: 0.4
            });
            return JSON.parse(response);
        }
        catch (error) {
            console.error('❌ Error identifying emerging elements:', error);
            return {
                authors: [],
                concepts: []
            };
        }
    }
}
exports.AdvancedRAGService = AdvancedRAGService;
exports.default = new AdvancedRAGService();
//# sourceMappingURL=AdvancedRAGService.js.map