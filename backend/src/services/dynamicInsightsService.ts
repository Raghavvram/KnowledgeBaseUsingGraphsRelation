// Dynamic insights generation from real paper data
export class DynamicInsightsService {
  
    static generateRealInsights(papers: any[], topic: string) {
      // Analyze real paper data
      const totalPapers = papers.length;
      const allAuthors = papers.flatMap(p => p.authors || []);
      const uniqueAuthors = new Set(allAuthors);
      const recentPapers = papers.filter(p => p.year && p.year >= 2022);
      const venues = papers.map(p => p.venue).filter(Boolean);
      const topVenues = [...new Set(venues)].slice(0, 3);
      
      // Extract real paper titles for analysis
      const realTitles = papers.map(p => p.title).filter(Boolean);
      const topCitedPapers = papers
        .filter(p => p.citationCount > 0)
        .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
        .slice(0, 3);
      
      // Generate insights based on real data
      const insights = {
        keyFindings: [
          `Successfully analyzed ${totalPapers} research papers focused on ${topic}`,
          `Identified ${uniqueAuthors.size} unique researchers actively contributing to ${topic} research`,
          `Found ${recentPapers.length} recent publications (2022+) showing current research momentum`,
          `Research published across ${topVenues.length} different venues including ${topVenues.join(', ')}`
        ]
      };
  
      return {
        insights,
        realPaperTitles: realTitles.slice(0, 5),
        topCitedPapers: topCitedPapers,
        researchStats: {
          totalPapers,
          uniqueAuthors: uniqueAuthors.size,
          recentPapers: recentPapers.length,
          topVenues: topVenues
        }
      };
    }
  }
