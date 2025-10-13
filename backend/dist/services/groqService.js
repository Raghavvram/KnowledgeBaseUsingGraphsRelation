"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groqService = void 0;
exports.searchPapersWithGroq = searchPapersWithGroq;
exports.generateInsightsWithGroq = generateInsightsWithGroq;
const openai_1 = __importDefault(require("openai"));
// Function to get Groq client (lazy initialization)
function getGroqClient() {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY environment variable is missing');
    }
    return new openai_1.default({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1'
    });
}
// Helper function to extract JSON from AI response
function extractJSON(content) {
    try {
        // First try direct parsing
        return JSON.parse(content);
    }
    catch (error) {
        try {
            // Try to find JSON in the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No JSON found in response');
        }
        catch (parseError) {
            console.warn('Failed to parse AI response as JSON:', content.substring(0, 100));
            throw new Error('Invalid JSON response from AI');
        }
    }
}
// Search and analyze papers using Groq AI
async function searchPapersWithGroq(topic) {
    try {
        console.log(`🧠 Using Groq AI to analyze: ${topic}`);
        const groq = getGroqClient();
        const prompt = `You must respond with ONLY valid JSON, no other text.

    Analyze "${topic}" research and return this exact JSON structure:
    {
      "papersFound": 127,
      "authorsAnalyzed": 89,
      "connectionsDiscovered": 342,
      "summary": "detailed summary of ${topic} research landscape"
    }

    Return only the JSON object, nothing else.`;
        const response = await groq.chat.completions.create({
            model: "llama3-8b-8192",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3, // Lower temperature for more consistent JSON
            max_tokens: 1000
        });
        const content = response.choices[0]?.message?.content;
        if (!content)
            throw new Error('No response from Groq');
        const analysis = extractJSON(content);
        console.log(`✅ Groq analyzed ${topic}`);
        return analysis;
    }
    catch (error) {
        console.error('❌ Groq API error:', error);
        throw error;
    }
}
async function generateInsightsWithGroq(prompt) {
    try {
        console.log(`🧩 Groq generating insights...`);
        const groq = getGroqClient();
        const enhancedPrompt = `You must respond with ONLY valid JSON, no other text or explanations.

    ${prompt}

    Return only the JSON object with the exact structure requested, nothing else.`;
        const response = await groq.chat.completions.create({
            model: "llama3-8b-8192",
            messages: [{ role: "user", content: enhancedPrompt }],
            temperature: 0.3, // Lower temperature for more consistent JSON
            max_tokens: 1500
        });
        const content = response.choices[0]?.message?.content;
        if (!content)
            throw new Error('No insights from Groq');
        const insights = extractJSON(content);
        console.log('✅ Groq insights generated successfully');
        return insights;
    }
    catch (error) {
        console.error('❌ Groq insights error:', error);
        throw error;
    }
}
class GroqService {
    async generateCompletion(prompt, options) {
        try {
            const groq = getGroqClient();
            const response = await groq.chat.completions.create({
                model: "llama3-8b-8192",
                messages: [{ role: "user", content: prompt }],
                temperature: options.temperature,
                max_tokens: options.maxTokens
            });
            const content = response.choices[0]?.message?.content;
            if (!content)
                throw new Error('No response from Groq');
            return content;
        }
        catch (error) {
            console.error('❌ Groq completion error:', error);
            throw error;
        }
    }
    async generateResponse(prompt) {
        try {
            const groq = getGroqClient();
            const response = await groq.chat.completions.create({
                model: "llama3-8b-8192",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            });
            const content = response.choices[0]?.message?.content;
            if (!content)
                throw new Error('No response from Groq');
            return content;
        }
        catch (error) {
            console.error('❌ Groq response error:', error);
            throw error;
        }
    }
}
exports.groqService = new GroqService();
//# sourceMappingURL=groqService.js.map