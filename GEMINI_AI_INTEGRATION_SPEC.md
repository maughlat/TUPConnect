# Gemini AI Integration Specification

## Overview
This document specifies the serverless backend endpoint required for TUPConnect's "Find Your Match" feature, which uses Google's Gemini AI to analyze student interests and match them with organization categories.

---

## Endpoint Specification

### **Endpoint: `/api/gemini-match`**

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Authentication:** Secure API key (store in environment variables)

### **Request Body:**
```json
{
  "student_interest": "I'm interested in programming, video games, and software development. I'm taking Computer Science."
}
```

### **Response (Success - 200 OK):**
```json
{
  "matched_categories": [
    "Technology/IT/Gaming",
    "Academic/Research"
  ]
}
```

### **Response (Error - 400/500):**
```json
{
  "error": "Error message describing what went wrong"
}
```

---

## Implementation Requirements

### **1. Environment Variables:**
- `GEMINI_API_KEY`: Your Google Gemini API key (must be stored securely, never exposed to client)

### **2. System Instruction (Critical for Gemini Prompting):**
The Gemini API call must use the following system instruction/prompt:

```
You are TUPConnect's organization matching AI. Your task is to analyze the user's provided text (interests, hobbies, course) and identify which of the following 10 categories are most relevant. Only return categories from this list. Return the result as a simple JSON array of strings, ONLY listing the relevant categories. Do not include any other text or explanation.

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
10. Culture/Religion

User input: {STUDENT_INTEREST}
```

### **3. Implementation Example (Vercel Serverless Function - Node.js):**

**File:** `api/gemini-match.js` (or `api/gemini-match/index.js`)

```javascript
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
    // Gemini API endpoint (using Generative AI SDK or REST API)
    // Option 1: Using @google/generative-ai SDK
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
    return res.status(500).json({ 
      error: 'Failed to process request with AI. Please try again later.' 
    });
  }
}
```

### **4. Alternative Implementation (Using REST API directly):**

If you prefer using the REST API directly:

```javascript
const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;

const requestBody = {
  contents: [{
    parts: [{
      text: `${systemInstruction}\n\nUser input: ${student_interest.trim()}\n\nReturn ONLY a JSON array like: ["Category 1", "Category 2"]`
    }]
  }]
};

const response = await fetch(geminiApiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestBody)
});

const data = await response.json();
const aiResponse = data.candidates[0].content.parts[0].text;
// ... continue with parsing logic from above
```

---

## Deployment Notes

### **Vercel:**
1. Install dependency: `npm install @google/generative-ai` (if using SDK)
2. Set environment variable in Vercel Dashboard:
   - Go to Project Settings > Environment Variables
   - Add `GEMINI_API_KEY` with your API key value
3. Deploy the function to `/api/gemini-match`

### **Other Platforms:**
- **Netlify Functions:** Similar structure, place in `netlify/functions/gemini-match.js`
- **AWS Lambda:** Use API Gateway + Lambda with similar handler structure
- **Azure Functions:** Use HTTP trigger with similar structure

---

## Security Considerations

1. **Never expose API key to client:** Always keep `GEMINI_API_KEY` in server-side environment variables
2. **Input validation:** Validate and sanitize user input before sending to Gemini
3. **Rate limiting:** Implement rate limiting to prevent abuse
4. **Error handling:** Never expose internal errors to clients; return generic error messages
5. **CORS:** Configure CORS appropriately if needed (Vercel handles this automatically)

---

## Testing

### **Test Request:**
```bash
curl -X POST https://tupconnect.vercel.app/api/gemini-match \
  -H "Content-Type: application/json" \
  -d '{"student_interest": "I love programming, video games, and building software. I study Computer Science."}'
```

### **Expected Response:**
```json
{
  "matched_categories": [
    "Technology/IT/Gaming",
    "Academic/Research"
  ]
}
```

---

## Error Handling

The endpoint should handle:
- Missing or invalid API key
- Network errors when calling Gemini API
- Invalid JSON responses from Gemini
- Rate limiting from Gemini API
- Malformed request bodies

All errors should return appropriate HTTP status codes (400 for client errors, 500 for server errors).

