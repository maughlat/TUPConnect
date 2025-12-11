import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests. Please use a tool like Postman or curl to test it, or use the "Find Your Match" page on the website.',
      acceptedMethods: ['POST'],
      example: {
        method: 'POST',
        url: 'https://tupconnect.vercel.app/api/gemini-match',
        headers: { 'Content-Type': 'application/json' },
        body: { student_interest: 'I love programming and video games' }
      }
    });
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

    // Try multiple model names in order of preference
    // Model availability may vary by API key permissions and region
    const modelNames = [
      'gemini-1.5-flash',     // Fastest model (try first)
      'gemini-1.5-pro',       // More capable model
      'gemini-1.0-pro',       // Older stable model
      'gemini-pro'            // Legacy name
    ];
    
    let result;
    let response;
    let aiResponse;
    let lastError = null;
    
    // Try each model until one works
    for (const modelName of modelNames) {
      try {
        console.log(`Attempting to use model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Call Gemini API with this model
        result = await model.generateContent(prompt);
        response = await result.response;
        aiResponse = response.text().trim();
        
        // If we get here, the model worked!
        console.log(`Successfully used model: ${modelName}`);
        break;
      } catch (err) {
        console.warn(`Model ${modelName} failed:`, err.message);
        lastError = err;
        
        // If it's a model-not-found error, try the next model
        if (err.message && err.message.includes('not found') || err.message && err.message.includes('404')) {
          continue; // Try next model
        } else {
          // If it's a different error (like API key issue), throw it
          throw err;
        }
      }
    }
    
    // If we still don't have a response, all models failed
    if (!aiResponse) {
      throw new Error(
        `All model attempts failed. Last error: ${lastError?.message || 'Unknown'}. ` +
        `Tried models: ${modelNames.join(', ')}. ` +
        `Please verify: (1) Your API key is valid and has Gemini API access, ` +
        `(2) Gemini API is enabled in Google Cloud Console, ` +
        `(3) Check available models at https://aistudio.google.com/app/apikey`
      );
    }

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