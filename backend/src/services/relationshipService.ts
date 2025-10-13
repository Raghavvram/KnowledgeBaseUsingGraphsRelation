// Enhanced relationship service for large datasets (400-500 papers)
export interface PaperRelationship {
    sourceId: string;
    targetId: string;
    relationshipType: 'citation' | 'content' | 'author' | 'temporal' | 'venue';
    strength: number;
    metadata?: {
      sharedKeywords?: string[];
      authorOverlap?: string[];
      citationCount?: number;
      yearDifference?: number;
      venueMatch?: boolean;
    };
  }
  
  export interface Paper {
    id: string;
    title: string;
    authors: string[];
    abstract?: string;
    year?: number;
    venue?: string;
    citationCount?: number;
    references?: string[];
    citations?: string[];
  }
  
  export class RelationshipService {
    
    // Enhanced relationship analysis for large datasets
    static analyzeRelationships(papers: Paper[]): PaperRelationship[] {
      console.log(`\ud83d\udd17 Analyzing relationships for ${papers.length} papers...`);
      
      const relationships: PaperRelationship[] = [];
      const authorIndex = this.buildAuthorIndex(papers);
      const venueIndex = this.buildVenueIndex(papers);
      const keywordIndex = this.buildKeywordIndex(papers);
      
      // Limit comparison for performance (sample for very large datasets)
      const maxComparisons = 50000; // Prevent O(n\u00b2) explosion
      const sampleSize = Math.min(papers.length, Math.sqrt(maxComparisons));
      const sampledPapers = this.stratifiedSample(papers, Math.floor(sampleSize));
      
      console.log(`\ud83d\udcca Processing ${sampledPapers.length} representative papers for relationship analysis`);
      
      // Build relationships using multiple strategies
      relationships.push(...this.findAuthorRelationships(sampledPapers, authorIndex));
      relationships.push(...this.findVenueRelationships(sampledPapers, venueIndex));
      relationships.push(...this.findContentRelationships(sampledPapers, keywordIndex));
      relationships.push(...this.findTemporalRelationships(sampledPapers));
      relationships.push(...this.findCitationRelationships(sampledPapers));
      
      // Deduplicate and rank relationships
      const uniqueRelationships = this.deduplicateRelationships(relationships);
      const rankedRelationships = this.rankRelationships(uniqueRelationships);
      
      console.log(`\u2705 Found ${rankedRelationships.length} high-quality relationships`);
      return rankedRelationships.slice(0, 200); // Return top 200 relationships for visualization
    }
    
    // Stratified sampling to ensure diverse paper representation
    private static stratifiedSample(papers: Paper[], sampleSize: number): Paper[] {
      // Group by year and venue for balanced sampling
      const yearGroups = new Map<number, Paper[]>();
      
      papers.forEach(paper => {
        const year = paper.year || 2024;
        if (!yearGroups.has(year)) {
          yearGroups.set(year, []);
        }
        yearGroups.get(year)!.push(paper);
      });
      
      const sample: Paper[] = [];
      const yearsArray = Array.from(yearGroups.keys()).sort();
      const papersPerYear = Math.ceil(sampleSize / yearsArray.length);
      
      yearsArray.forEach(year => {
        const yearPapers = yearGroups.get(year)!;
        const yearSample = yearPapers
          .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0)) // Prefer highly cited
          .slice(0, papersPerYear);
        sample.push(...yearSample);
      });
      
      return sample.slice(0, sampleSize);
    }
    
    // Build author collaboration index
    private static buildAuthorIndex(papers: Paper[]): Map<string, Paper[]> {
      const authorIndex = new Map<string, Paper[]>();
      
      papers.forEach(paper => {
        paper.authors.forEach(author => {
          const normalizedAuthor = author.toLowerCase().trim();
          if (!authorIndex.has(normalizedAuthor)) {
            authorIndex.set(normalizedAuthor, []);
          }
          authorIndex.get(normalizedAuthor)!.push(paper);
        });
      });
      
      return authorIndex;
    }
    
    // Build venue co-occurrence index
    private static buildVenueIndex(papers: Paper[]): Map<string, Paper[]> {
      const venueIndex = new Map<string, Paper[]>();
      
      papers.forEach(paper => {
        if (paper.venue) {
          const normalizedVenue = paper.venue.toLowerCase().trim();
          if (!venueIndex.has(normalizedVenue)) {
            venueIndex.set(normalizedVenue, []);
          }
          venueIndex.get(normalizedVenue)!.push(paper);
        }
      });
      
      return venueIndex;
    }
    
    // Build keyword co-occurrence index
    private static buildKeywordIndex(papers: Paper[]): Map<string, Paper[]> {
      const keywordIndex = new Map<string, Paper[]>();
      
      papers.forEach(paper => {
        const keywords = this.extractKeywords(paper.title + ' ' + (paper.abstract || ''));
        keywords.forEach(keyword => {
          if (!keywordIndex.has(keyword)) {
            keywordIndex.set(keyword, []);
          }
          keywordIndex.get(keyword)!.push(paper);
        });
      });
      
      return keywordIndex;
    }
    
    // Extract meaningful keywords from text
    private static extractKeywords(text: string): string[] {
      const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'this', 'that', 'these', 'those'
      ]);
      
      return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word))
        .slice(0, 20); // Top 20 keywords per paper
    }
    
    // Find author-based relationships
    private static findAuthorRelationships(papers: Paper[], authorIndex: Map<string, Paper[]>): PaperRelationship[] {
      const relationships: PaperRelationship[] = [];
      
      papers.forEach(paper => {
        paper.authors.forEach(author => {
          const authorPapers = authorIndex.get(author.toLowerCase()) || [];
          authorPapers.forEach(otherPaper => {
            if (paper.id !== otherPaper.id) {
              const sharedAuthors = paper.authors.filter(a => 
                otherPaper.authors.some(oa => oa.toLowerCase() === a.toLowerCase())
              );
              
              if (sharedAuthors.length > 0) {
                relationships.push({
                  sourceId: paper.id,
                  targetId: otherPaper.id,
                  relationshipType: 'author',
                  strength: Math.min(0.9, sharedAuthors.length * 0.3),
                  metadata: {
                    authorOverlap: sharedAuthors
                  }
                });
              }
            }
          });
        });
      });
      
      return relationships;
    }
    
    // Find venue-based relationships
    private static findVenueRelationships(papers: Paper[], venueIndex: Map<string, Paper[]>): PaperRelationship[] {
      const relationships: PaperRelationship[] = [];
      
      papers.forEach(paper => {
        if (paper.venue) {
          const venuePapers = venueIndex.get(paper.venue.toLowerCase()) || [];
          venuePapers.forEach(otherPaper => {
            if (paper.id !== otherPaper.id && Math.random() > 0.8) { // Sample venue relationships
              relationships.push({
                sourceId: paper.id,
                targetId: otherPaper.id,
                relationshipType: 'venue',
                strength: 0.4,
                metadata: {
                  venueMatch: true
                }
              });
            }
          });
        }
      });
      
      return relationships;
    }
    
    // Find content-based relationships using keyword overlap
    private static findContentRelationships(papers: Paper[], keywordIndex: Map<string, Paper[]>): PaperRelationship[] {
      const relationships: PaperRelationship[] = [];
      
      papers.forEach(paper => {
        const paperKeywords = this.extractKeywords(paper.title + ' ' + (paper.abstract || ''));
        const relatedPapers = new Map<string, number>();
        
        paperKeywords.forEach(keyword => {
          const keywordPapers = keywordIndex.get(keyword) || [];
          keywordPapers.forEach(otherPaper => {
            if (paper.id !== otherPaper.id) {
              relatedPapers.set(otherPaper.id, (relatedPapers.get(otherPaper.id) || 0) + 1);
            }
          });
        });
        
        // Create relationships for papers with significant keyword overlap
        relatedPapers.forEach((overlapCount, otherId) => {
          if (overlapCount >= 3) { // At least 3 shared keywords
            const otherPaper = papers.find(p => p.id === otherId);
            if (otherPaper) {
              relationships.push({
                sourceId: paper.id,
                targetId: otherId,
                relationshipType: 'content',
                strength: Math.min(0.8, overlapCount * 0.1),
                metadata: {
                  sharedKeywords: paperKeywords.slice(0, 5)
                }
              });
            }
          }
        });
      });
      
      return relationships;
    }
    
    // Find temporal relationships (papers from similar time periods)
    private static findTemporalRelationships(papers: Paper[]): PaperRelationship[] {
      const relationships: PaperRelationship[] = [];
      
      papers.forEach((paper, index) => {
        if (paper.year && index < papers.length - 1) {
          // Find papers from same or adjacent years
          const contemporaryPapers = papers.slice(index + 1).filter(otherPaper => 
            otherPaper.year && Math.abs(otherPaper.year - paper.year!) <= 1
          );
          
          contemporaryPapers.slice(0, 3).forEach(otherPaper => { // Limit to 3 per paper
            if (Math.random() > 0.7) { // Sample temporal relationships
              relationships.push({
                sourceId: paper.id,
                targetId: otherPaper.id,
                relationshipType: 'temporal',
                strength: 0.3,
                metadata: {
                  yearDifference: Math.abs(otherPaper.year! - paper.year!)
                }
              });
            }
          });
        }
      });
      
      return relationships;
    }
    
    // Find citation-based relationships
    private static findCitationRelationships(papers: Paper[]): PaperRelationship[] {
      const relationships: PaperRelationship[] = [];
      const paperIdMap = new Map(papers.map(p => [p.id, p]));
      
      papers.forEach(paper => {
        // Check references
        paper.references?.forEach(refId => {
          if (paperIdMap.has(refId)) {
            relationships.push({
              sourceId: paper.id,
              targetId: refId,
              relationshipType: 'citation',
              strength: 0.9,
              metadata: {
                citationCount: paper.citationCount
              }
            });
          }
        });
        
        // Check citations
        paper.citations?.forEach(citId => {
          if (paperIdMap.has(citId)) {
            relationships.push({
              sourceId: citId,
              targetId: paper.id,
              relationshipType: 'citation',
              strength: 0.9,
              metadata: {
                citationCount: paper.citationCount
              }
            });
          }
        });
      });
      
      return relationships;
    }
    
    // Remove duplicate relationships
    private static deduplicateRelationships(relationships: PaperRelationship[]): PaperRelationship[] {
      const seen = new Set<string>();
      const unique: PaperRelationship[] = [];
      
      relationships.forEach(rel => {
        const key1 = `${rel.sourceId}-${rel.targetId}-${rel.relationshipType}`;
        const key2 = `${rel.targetId}-${rel.sourceId}-${rel.relationshipType}`;
        
        if (!seen.has(key1) && !seen.has(key2)) {
          seen.add(key1);
          unique.push(rel);
        }
      });
      
      return unique;
    }
    
    // Rank relationships by strength and importance
    private static rankRelationships(relationships: PaperRelationship[]): PaperRelationship[] {
      return relationships.sort((a, b) => {
        // Prioritize citation relationships, then author, then content, then venue, then temporal
        const typeWeight = {
          citation: 5,
          author: 4,
          content: 3,
          venue: 2,
          temporal: 1
        };
        
        const aScore = (typeWeight[a.relationshipType] || 0) * a.strength;
        const bScore = (typeWeight[b.relationshipType] || 0) * b.strength;
        
        return bScore - aScore;
      });
    }
  }
