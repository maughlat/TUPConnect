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
    // System instruction for Gemini - Advanced matching with 15 granular categories
    const systemInstruction = `You are TUPConnect's advanced matching engine. Analyze the student's input deeply and map it to the specific TUP ecosystem.

**1. DETECT AFFILIATION (Strict Mapping):**
   - Extract the user's course/college and map to: **COS, COE, CIT, CAFA, CLA, CIE**.
   - Mapping: COS = Computer Science/IT/IS/Physics/Chemistry/Math/Science; COE = Civil/Mechanical/Electrical/Electronics Engineering; CIT = Engineering Technology/Automotive/Power Plant/Casting; CAFA = Architecture/Fine Arts/Graphics; CLA = Liberal Arts/Business/Hospitality; CIE = Industrial Education/Home Economics.
   - If no course is mentioned, return **"NONE"**.

**2. DETECT SPECIFIC CATEGORIES (Granular Match):**
   - Identify the top 3 relevant categories from this specific list:
     1. **Computer Science & Software** (Coding, Apps, Web, AI) -> *Strictly for IT/CS*
     2. **Engineering & Robotics** (Hardware, Circuits, Civil, Mechanical) -> *Strictly for Eng*
     3. **Architecture & Construction** (Design, Buildings, Drafting)
     4. **Science & Laboratory** (Chemistry, Physics, Math, Research)
     5. **Gaming & Esports** (Video Games, Competition)
     6. **Visual Arts & Media** (Drawing, Graphics, Photo, Video)
     7. **Business & Entrepreneurship** (Management, Finance, Startups)
     8. **Hospitality & Lifestyle** (Food, Fashion, Home Econ, Travel)
     9. **Education & Teaching** (Teaching, Mentoring, Pedagogy)
     10. **Technical & Industrial Trades** (Automotive, Power Plant, Hands-on)
     11. **Student Government & Leadership** (Politics, Management, Leading)
     12. **Community Service & Welfare** (Volunteering, Animal Care, Helping)
     13. **Social Advocacy & Inclusivity** (Gender, Pride, Mental Health)
     14. **Faith & Religion** (Spiritual, Muslim, Christian)
     15. **Academic Excellence** (Scholarships, Honor Society)

**3. DETECT KEYWORDS:**
   - Extract specific nouns (e.g., "cats", "hackathon", "dance") as \`specific_keywords\`.
   - Translate informal terms: "making apps" -> "software", "coding"; "helping people" -> "service", "volunteering"; "God/Faith" -> "religious", "spiritual"; "cats/dogs" -> "animal", "welfare".

**4. DETECT NEGATIVES:**
   - Extract dislikes (e.g., "I hate math", "not into sports") as \`negative_keywords\`.

**OUTPUT FORMAT (JSON ONLY):**
Return ONLY a JSON object in this exact format:
{
  "user_affiliation": "CODE_OR_NONE",
  "matched_categories": ["Specific Category 1", "Specific Category 2"],
  "specific_keywords": ["kw1", "kw2"],
  "negative_keywords": ["neg1"]
}

Do not include any other text or explanation.`;

    const prompt = `${systemInstruction}\n\nUser input: ${student_interest.trim()}\n\nReturn ONLY the JSON object, no other text.`;

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
          console.log(`Raw AI response: ${aiResponse.substring(0, 200)}...`);
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
        } else if (err.message && err.message.includes('403')) {
          // Check if it's a leaked key error
          if (err.message.includes('leaked') || err.message.includes('reported')) {
            throw new Error('Your API key was reported as leaked and has been revoked. Please create a NEW API key at https://aistudio.google.com/app/apikey and update it in Vercel environment variables. Do NOT reuse the old key.');
          }
          // Other 403 errors - don't try other models
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
    
    // Try to extract JSON object from response
    let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiResponse = jsonMatch[0];
    }

    // Parse JSON response - now expects an object, not an array
    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', aiResponse);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate that result is an object with expected structure
    if (typeof analysisResult !== 'object' || Array.isArray(analysisResult)) {
      throw new Error('AI response is not a valid JSON object');
    }

    // Extract and validate fields
    const userAffiliation = analysisResult.user_affiliation || 'NONE';
    let matchedCategories = analysisResult.matched_categories || [];
    const specificKeywords = analysisResult.specific_keywords || [];
    const negativeKeywords = analysisResult.negative_keywords || [];

    // Validate categories against the 15 granular categories
    const validCategories = [
      'Computer Science & Software',
      'Engineering & Robotics',
      'Architecture & Construction',
      'Science & Laboratory',
      'Gaming & Esports',
      'Visual Arts & Media',
      'Business & Entrepreneurship',
      'Hospitality & Lifestyle',
      'Education & Teaching',
      'Technical & Industrial Trades',
      'Student Government & Leadership',
      'Community Service & Welfare',
      'Social Advocacy & Inclusivity',
      'Faith & Religion',
      'Academic Excellence'
    ];

    const filteredCategories = matchedCategories.filter(cat => 
      validCategories.includes(cat)
    );

    // Validate affiliation
    const validAffiliations = ['COS', 'COE', 'CIT', 'CAFA', 'CLA', 'CIE', 'NONE'];
    const finalAffiliation = validAffiliations.includes(userAffiliation) ? userAffiliation : 'NONE';

    // Return the full analysis result including negative keywords
    return res.status(200).json({
      user_affiliation: finalAffiliation,
      matched_categories: filteredCategories,
      specific_keywords: specificKeywords,
      negative_keywords: Array.isArray(negativeKeywords) ? negativeKeywords : []
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