export declare function searchPapersWithGroq(topic: string): Promise<any>;
export declare function generateInsightsWithGroq(prompt: string): Promise<any>;
declare class GroqService {
    generateCompletion(prompt: string, options: {
        maxTokens: number;
        temperature: number;
    }): Promise<string>;
    generateResponse(prompt: string): Promise<string>;
}
export declare const groqService: GroqService;
export {};
//# sourceMappingURL=groqService.d.ts.map