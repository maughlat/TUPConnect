// Using REST API directly instead of SDK for better compatibility
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

    // First, list available models to see what we can use
    let availableModels = [];
    try {
      console.log('Listing available models...');
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`;
      const listResponse = await fetch(listUrl);
      
      if (listResponse.ok) {
        const listData = await listResponse.json();
        if (listData.models && Array.isArray(listData.models)) {
          // Filter models that support generateContent
          availableModels = listData.models
            .filter(model => 
              model.supportedGenerationMethods && 
              model.supportedGenerationMethods.includes('generateContent')
            )
            .map(model => model.name.replace('models/', ''))
            .sort(); // Sort alphabetically
          
          console.log(`Found ${availableModels.length} available models:`, availableModels);
        }
      }
    } catch (listError) {
      console.warn('Failed to list models, will try default list:', listError.message);
    }
    
    // Build model list: prefer available models, fallback to defaults
    const preferredModels = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash-001',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro-002',
      'gemini-1.5-pro-001',
      'gemini-1.5-pro',
      'gemini-1.0-pro-latest',
      'gemini-1.0-pro-001',
      'gemini-1.0-pro',
      'gemini-pro-latest',
      'gemini-pro'
    ];
    
    // Combine available models (if found) with preferred models
    const modelNames = availableModels.length > 0 
      ? [...new Set([...availableModels, ...preferredModels])] // Unique models, available first
      : preferredModels;
    
    let aiResponse = null;
    let lastError = null;
    
    // Try each model using REST API
    for (const modelName of modelNames) {
      try {
        console.log(`Attempting to use model: ${modelName}`);
        
        // Use REST API directly
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: await response.text() };
          }
          throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        
        // Extract text from response
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
          aiResponse = data.candidates[0].content.parts[0].text.trim();
          console.log(`Successfully used model: ${modelName}`);
          break;
        } else {
          throw new Error('Unexpected response format from Gemini API');
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed:`, err.message);
        lastError = err;
        
        // If it's a model-not-found error (404), try the next model
        if (err.message && (err.message.includes('404') || err.message.includes('not found'))) {
          continue; // Try next model
        } else if (err.message && err.message.includes('403') || err.message && err.message.includes('API key')) {
          // API key or permission issue - don't try other models
          throw new Error(`API key or permission issue: ${err.message}. Please check your API key and ensure Gemini API is enabled.`);
        } else {
          // Other errors - try next model but log it
          continue;
        }
      }
    }
    
    // If we still don't have a response, all models failed
    if (!aiResponse) {
      throw new Error(
        `All model attempts failed. Last error: ${lastError?.message || 'Unknown'}. ` +
        `Tried models: ${modelNames.join(', ')}. ` +
        `Please verify: (1) Your API key is valid, (2) Gemini API is enabled in Google Cloud Console, ` +
        `(3) Your API key has access to Gemini models. Check: https://aistudio.google.com/app/apikey`
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