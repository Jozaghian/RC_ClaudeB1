const axios = require('axios');

class AIModerationService {
  constructor() {
    this.apiKey = process.env.AI_MODERATION_API_KEY;
    this.apiUrl = process.env.AI_MODERATION_API_URL || 'https://api.openai.com/v1/moderations';
    this.enabled = !!this.apiKey;
    
    if (!this.enabled) {
      console.warn('⚠️ AI Moderation Service: API key not configured. Content moderation will be disabled.');
    }
  }

  async moderateText(text, context = 'general') {
    if (!this.enabled) {
      return {
        flagged: false,
        categories: {},
        scores: {},
        confidence: 0,
        reason: 'AI moderation disabled - no API key configured'
      };
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return {
        flagged: false,
        categories: {},
        scores: {},
        confidence: 1,
        reason: 'Empty or invalid text'
      };
    }

    try {
      // Use OpenAI Moderation API as default
      const response = await axios.post(
        this.apiUrl,
        {
          input: text,
          model: 'text-moderation-latest'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      const moderation = response.data.results[0];
      
      return {
        flagged: moderation.flagged,
        categories: moderation.categories,
        scores: moderation.category_scores,
        confidence: Math.max(...Object.values(moderation.category_scores)),
        reason: moderation.flagged ? this.getFlaggedReason(moderation.categories) : 'Content approved',
        context
      };

    } catch (error) {
      console.error('AI Moderation Service error:', error.message);
      
      // Fall back to basic keyword filtering if API fails
      return this.basicModerationFallback(text, context);
    }
  }

  getFlaggedReason(categories) {
    const flaggedCategories = Object.entries(categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category);
    
    if (flaggedCategories.length === 0) return 'Content flagged by AI moderation';
    
    return `Content flagged for: ${flaggedCategories.join(', ')}`;
  }

  basicModerationFallback(text, context) {
    const lowercaseText = text.toLowerCase();
    
    // Basic inappropriate content detection
    const inappropriateKeywords = [
      'fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'bastard',
      'drug', 'drugs', 'weed', 'cocaine', 'heroin', 'meth',
      'sex', 'porn', 'nude', 'naked', 'escort',
      'kill', 'murder', 'suicide', 'bomb', 'weapon',
      'hate', 'racist', 'nazi', 'terrorism'
    ];

    const flaggedKeywords = inappropriateKeywords.filter(keyword => 
      lowercaseText.includes(keyword)
    );

    const flagged = flaggedKeywords.length > 0;

    return {
      flagged,
      categories: {
        harassment: flaggedKeywords.some(k => ['hate', 'racist', 'nazi'].includes(k)),
        violence: flaggedKeywords.some(k => ['kill', 'murder', 'bomb', 'weapon'].includes(k)),
        sexual: flaggedKeywords.some(k => ['sex', 'porn', 'nude', 'escort'].includes(k)),
        illegal: flaggedKeywords.some(k => ['drug', 'drugs', 'cocaine', 'heroin'].includes(k))
      },
      scores: {},
      confidence: flagged ? 0.8 : 0.2,
      reason: flagged ? `Basic filter detected: ${flaggedKeywords.join(', ')}` : 'Content approved by basic filter',
      context,
      fallback: true
    };
  }

  async moderateRideContent(rideData) {
    const results = {};
    
    if (rideData.pickupDetails) {
      results.pickupDetails = await this.moderateText(rideData.pickupDetails, 'pickup_details');
    }
    
    if (rideData.dropoffDetails) {
      results.dropoffDetails = await this.moderateText(rideData.dropoffDetails, 'dropoff_details');
    }
    
    if (rideData.notes) {
      results.notes = await this.moderateText(rideData.notes, 'ride_notes');
    }

    const hasFlaggedContent = Object.values(results).some(result => result.flagged);
    
    return {
      approved: !hasFlaggedContent,
      results,
      flaggedFields: Object.entries(results)
        .filter(([_, result]) => result.flagged)
        .map(([field]) => field)
    };
  }

  async moderateRequestContent(requestData) {
    const results = {};
    
    if (requestData.originDetails) {
      results.originDetails = await this.moderateText(requestData.originDetails, 'origin_details');
    }
    
    if (requestData.destinationDetails) {
      results.destinationDetails = await this.moderateText(requestData.destinationDetails, 'destination_details');
    }
    
    if (requestData.specialRequirements) {
      results.specialRequirements = await this.moderateText(requestData.specialRequirements, 'special_requirements');
    }
    
    if (requestData.description) {
      results.description = await this.moderateText(requestData.description, 'request_description');
    }

    const hasFlaggedContent = Object.values(results).some(result => result.flagged);
    
    return {
      approved: !hasFlaggedContent,
      results,
      flaggedFields: Object.entries(results)
        .filter(([_, result]) => result.flagged)
        .map(([field]) => field)
    };
  }

  async moderateProfileContent(profileData) {
    const results = {};
    
    if (profileData.bio) {
      results.bio = await this.moderateText(profileData.bio, 'user_bio');
    }
    
    if (profileData.preferredName) {
      results.preferredName = await this.moderateText(profileData.preferredName, 'preferred_name');
    }

    const hasFlaggedContent = Object.values(results).some(result => result.flagged);
    
    return {
      approved: !hasFlaggedContent,
      results,
      flaggedFields: Object.entries(results)
        .filter(([_, result]) => result.flagged)
        .map(([field]) => field)
    };
  }

  async moderateMessage(messageContent) {
    return await this.moderateText(messageContent, 'chat_message');
  }

  // Generic method for any text content
  async moderateContent(content, context = 'general') {
    if (typeof content === 'string') {
      return await this.moderateText(content, context);
    }
    
    if (typeof content === 'object' && content !== null) {
      const results = {};
      
      for (const [key, value] of Object.entries(content)) {
        if (typeof value === 'string' && value.trim().length > 0) {
          results[key] = await this.moderateText(value, `${context}_${key}`);
        }
      }
      
      const hasFlaggedContent = Object.values(results).some(result => result.flagged);
      
      return {
        approved: !hasFlaggedContent,
        results,
        flaggedFields: Object.entries(results)
          .filter(([_, result]) => result.flagged)
          .map(([field]) => field)
      };
    }
    
    throw new Error('Content must be a string or object');
  }
}

// Create singleton instance
const aiModerationService = new AIModerationService();

module.exports = aiModerationService;