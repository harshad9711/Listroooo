import { ugcService, type UGCContent, type UGCEdit, type UGCVoiceover, type UGCHotspot, type UGCInboxItem } from "./ugcService";

// UGC API Endpoints
export class UGCApiService {
  private baseUrl = '/api/ugc';

  // Content Discovery
  async discoverContent(hashtags: string[], brandKeywords: string[], platforms: string[] = ['instagram', 'tiktok']): Promise<UGCContent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hashtags,
          brandKeywords,
          platforms
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error discovering content:', error);
      // Fallback to service layer for development
      return ugcService.discoverContent(hashtags, brandKeywords, platforms);
    }
  }

  // Rights Management
  async requestRights(contentId: string, brandId: string, terms: any): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/rights/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          brandId,
          terms
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting rights:', error);
      // Fallback to service layer for development
      return ugcService.requestRights(contentId, brandId, terms);
    }
  }

  async checkRightsStatus(contentId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/rights/status/${contentId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Error checking rights status:', error);
      // Fallback to service layer for development
      return ugcService.checkRightsStatus(contentId);
    }
  }

  async approveRights(contentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/rights/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error approving rights:', error);
      // Fallback to service layer for development
      return ugcService.approveRights(contentId);
    }
  }

  // Auto-Editing
  async autoEdit(contentId: string, brandGuidelines: any): Promise<UGCEdit> {
    try {
      const response = await fetch(`${this.baseUrl}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          brandGuidelines
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error auto-editing:', error);
      // Fallback to service layer for development
      return ugcService.autoEdit(contentId, brandGuidelines);
    }
  }

  async getEdits(contentId: string): Promise<UGCEdit[]> {
    try {
      const response = await fetch(`${this.baseUrl}/edit/${contentId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting edits:', error);
      // Fallback to service layer for development
      return ugcService.getEdits(contentId);
    }
  }

  // Voiceover Generation
  async generateVoiceover(contentId: string, script?: string, voiceType: string = 'neutral'): Promise<UGCVoiceover> {
    try {
      const response = await fetch(`${this.baseUrl}/voiceover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          script,
          voiceType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating voiceover:', error);
      // Fallback to service layer for development
      return ugcService.generateVoiceover(contentId, script, voiceType);
    }
  }

  async getVoiceovers(contentId: string): Promise<UGCVoiceover[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voiceover/${contentId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting voiceovers:', error);
      // Fallback to service layer for development
      return ugcService.getVoiceovers(contentId);
    }
  }

  // Hotspot Generation
  async generateHotspots(contentId: string): Promise<UGCHotspot[]> {
    try {
      const response = await fetch(`${this.baseUrl}/hotspots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating hotspots:', error);
      // Fallback to service layer for development
      return ugcService.generateHotspots(contentId);
    }
  }

  async getHotspots(contentId: string): Promise<UGCHotspot[]> {
    try {
      const response = await fetch(`${this.baseUrl}/hotspots/${contentId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting hotspots:', error);
      // Fallback to service layer for development
      return ugcService.getHotspots(contentId);
    }
  }

  // Inbox Management
  async getInbox(status?: string): Promise<UGCInboxItem[]> {
    try {
      const url = status ? `${this.baseUrl}/inbox?status=${status}` : `${this.baseUrl}/inbox`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting inbox:', error);
      // Fallback to service layer for development
      return ugcService.getInbox(status);
    }
  }

  async updateInboxStatus(itemId: string, status: string, notes?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/inbox/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          notes
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating inbox status:', error);
      // Fallback to service layer for development
      return ugcService.updateInboxStatus(itemId, status, notes);
    }
  }

  async addToInbox(contentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/inbox`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error adding to inbox:', error);
      // Fallback to service layer for development
      return ugcService.addToInbox(contentId);
    }
  }

  // Analytics
  async getAnalytics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting analytics:', error);
      // Fallback to service layer for development
      return ugcService.getAnalytics();
    }
  }

  // Content Management
  async getContent(contentId: string): Promise<UGCContent> {
    try {
      const response = await fetch(`${this.baseUrl}/content/${contentId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting content:', error);
      throw error;
    }
  }

  async updateContent(contentId: string, updates: Partial<UGCContent>): Promise<UGCContent> {
    try {
      const response = await fetch(`${this.baseUrl}/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating content:', error);
      throw error;
    }
  }

  async deleteContent(contentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/content/${contentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      throw error;
    }
  }

  // Batch Operations
  async batchProcess(contentIds: string[], operation: 'edit' | 'voiceover' | 'hotspots', options?: any): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentIds,
          operation,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error batch processing:', error);
      throw error;
    }
  }

  // Search and Filter
  async searchContent(query: string, filters?: any): Promise<UGCContent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          filters
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching content:', error);
      throw error;
    }
  }

  // Export
  async exportContent(contentIds: string[], format: 'csv' | 'json' | 'pdf' = 'json'): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentIds,
          format
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting content:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const ugcApi = new UGCApiService();
