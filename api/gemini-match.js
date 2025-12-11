import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment variables
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error('GEMINI_API_KEY is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Validate request body
  const { student_interest } = req.body;
  if (!student_interest || typeof student_interest !== 'string' || student_interest.trim().length === 0) {
    return res.status(400).json({ error: 'student_interest is required and must be a non-empty string' });
  }

  try {
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    
    // Try the latest model first, fallback to older models if needed
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } catch (modelError) {
      // Fallback to gemini-pro if gemini-1.5-flash doesn't work
      console.warn('gemini-1.5-flash not available, trying gemini-pro:', modelError);
      model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }

    // System instruction for Gemini
    const systemInstruction = `You are TUPConnect's organization matching AI. Your task is to analyze the user's provided text (interests, hobbies, course) and identify which of the following 10 categories are most relevant. Only return categories from this list. Return the result as a simple JSON array of strings, ONLY listing the relevant categories. Do not include any other text or explanation.

The 10 categories are:
1. Academic/Research
2. Technology/IT/Gaming
3. Engineering/Built Env.
4. Arts/Design/Media
5. Leadership/Governance
6. Service/Welfare/Outreach
7. Entrepreneurship/Finance
8. Industrial/Applied Skills
9. Social Justice/Advocacy
10. Culture/Religion`;

    const prompt = `${systemInstruction}\n\nUser input: ${student_interest.trim()}\n\nReturn ONLY a JSON array like: ["Category 1", "Category 2"]`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let aiResponse = response.text().trim();

    // Clean up response - remove markdown code blocks if present
    aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON response
    let matchedCategories;
    try {
      matchedCategories = JSON.parse(aiResponse);
    } catch (parseError) {
      // If parsing fails, try to extract array from text
      const arrayMatch = aiResponse.match(/\[(.*?)\]/);
      if (arrayMatch) {
        try {
          matchedCategories = JSON.parse(arrayMatch[0]);
        } catch (e) {
          throw new Error('Failed to parse AI response as JSON');
        }
      } else {
        throw new Error('AI response does not contain a valid JSON array');
      }
    }

    // Validate that result is an array
    if (!Array.isArray(matchedCategories)) {
      throw new Error('AI response is not an array');
    }

    // Validate categories against the 10 allowed categories
    const validCategories = [
      'Academic/Research',
      'Technology/IT/Gaming',
      'Engineering/Built Env.',
      'Arts/Design/Media',
      'Leadership/Governance',
      'Service/Welfare/Outreach',
      'Entrepreneurship/Finance',
      'Industrial/Applied Skills',
      'Social Justice/Advocacy',
      'Culture/Religion'
    ];

    const filteredCategories = matchedCategories.filter(cat => 
      validCategories.includes(cat)
    );

    // Return matched categories
    return res.status(200).json({
      matched_categories: filteredCategories
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Provide more detailed error information for debugging
    let errorMessage = 'Failed to process request with AI. Please try again later.';
    
    if (error.message && error.message.includes('API_KEY_INVALID')) {
      errorMessage = 'Invalid API key. Please check your GEMINI_API_KEY in Vercel environment variables.';
    } else if (error.message && error.message.includes('MODEL_NOT_FOUND')) {
      errorMessage = 'Model not found. The Gemini API model may have changed.';
    } else if (error.message && error.message.includes('PERMISSION_DENIED')) {
      errorMessage = 'API key does not have permission to access Gemini API.';
    } else if (error.message && error.message.includes('QUOTA_EXCEEDED')) {
      errorMessage = 'API quota exceeded. Please check your Google Cloud quotas.';
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}