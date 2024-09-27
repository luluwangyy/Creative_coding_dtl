// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); // Load environment variables

// Initialize the Express app
const app = express();

// Middleware setup
app.use(cors()); // Enable CORS for cross-origin requests
app.use(bodyParser.json()); // Parse JSON requests

// Helper function to merge partial updates
function mergePartialUpdate(original, update) {
  if (!update || update === original) return original;

  const originalLines = original.split('\n');
  const updateLines = update.split('\n');

  // Find the start and end of the update in the original code
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < originalLines.length; i++) {
    if (originalLines[i].trim() === updateLines[0].trim()) {
      startIndex = i;
      endIndex = i + updateLines.length;
      break;
    }
  }

  // If we couldn't find the exact match, fall back to a more lenient approach
  if (startIndex === -1) {
    for (let i = 0; i < originalLines.length; i++) {
      if (originalLines[i].includes(updateLines[0].trim())) {
        startIndex = i;
        endIndex = i + updateLines.length;
        break;
      }
    }
  }

  // If we still couldn't find a match, return the original code
  if (startIndex === -1) {
    console.warn("Couldn't find the update location in the original code. Returning original code.");
    return original;
  }

  // Merge the update into the original
  return [
    ...originalLines.slice(0, startIndex),
    ...updateLines,
    ...originalLines.slice(endIndex)
  ].join('\n');
}
// POST endpoint to handle the JavaScript code input
app.post('/generate-flowchart', async (req, res) => {
  const userCode = req.body.code; // Retrieve the user's code from the request body

  if (!userCode) {
    console.error("No code received in request body.");
    return res.status(400).send('No code provided.');
  }

  try {
    console.log("Received code:", userCode);

    // Request data for the OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: `Create a flowchart in Mermaid syntax for the following JavaScript code: ${userCode}. Generate only the Mermaid syntax flowchart. Do not include any explanations, introductions, or additional text. 
          Only output the raw Mermaid code. 
          Do not include any ( or ) or any quotation marks.
          Do not include sentences like "This flowchart represents the steps the JavaScript code is taking and how it flows from one execution to another." Do not start with the word "mermaid". Just start with raw code and end with raw code. Example:
            '''  
            graph TD
              A[Start] --> B[Initialize Renderer]
              B --> C[Create Scene]
              C --> D[Set Up Camera]
              D --> E[Create Container Object]
              E --> F[Load Texture with Loader]
              F --> G[Define createDots Function]
              G --> H[Set Up TweenMax Animation]
              H --> I[Define Render Function]
              I --> J[Call createDots]
              J --> K[Start Animation Loop]
              K --> L[Add Window Resize Event Listener]
              G --> G1[Create Geometry]
              G --> G2[Create Plane Geometry]
              G --> G3[Create Dots]
              I --> I1[Update Dots Vertices]
              I --> I2[Update Plane Vertices]
              I --> I3[Update Camera Position]
              I --> I4[Render Scene with Renderer]
              L --> L1[Update Camera Aspect Ratio]
              L --> L2[Adjust Renderer Size]
              K --> I
              I --> K

              Do not include any other sentences!
               
              ` }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}` // Use the API key from environment variables
        }
      }
    );

    // Extract the Mermaid syntax from the response
    if (response.data.choices && response.data.choices.length > 0) {
      const mermaidSyntax = response.data.choices[0].message.content;

      // Extract output without ''' and 'mermaid'
      const cleanedMermaidSyntax = mermaidSyntax.replace(/```mermaid|```/g, '').trim();
      console.log("Generated Mermaid syntax:", cleanedMermaidSyntax);
      res.json({ mermaid: cleanedMermaidSyntax });
    } else {
      console.error("Unexpected response format from OpenAI API:", response.data);
      res.status(500).send('Error: Unexpected response format from OpenAI API.');
    }
  } catch (error) {
    // Log detailed error information
    console.error('Error occurred while communicating with OpenAI:', error.response ? error.response.data : error.message);
    res.status(500).send('Error generating flowchart.');
  }
});

// POST endpoint to handle the LLM chat
app.post('/llm-chat', async (req, res) => {
  console.log('Received request to /llm-chat');
  try {
    const { llmInput, code, htmlCode, cssCode } = req.body;
    console.log('Request body:', { llmInput, code, htmlCode, cssCode });

    if (!llmInput || !code || !htmlCode || !cssCode) {
      console.log('Missing required input fields');
      return res.status(400).json({ error: 'Missing required input fields' });
    }

    console.log('Sending request to OpenAI API');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that can modify code based on user requests. Respond with a valid JSON object containing modified code sections.' },
          { role: 'user', content: `Given the following code:

JavaScript:
${code}

HTML:
${htmlCode}

CSS:
${cssCode}

User request: ${llmInput}

Please modify the appropriate code to fulfill the user's request. Return ONLY a valid JSON object with keys 'js', 'html', and 'css'. Each key should contain an object with 'original' and 'modified' properties. 

If a section needs modification, include ONLY the changed function section in the 'modified' property.
If a section doesn't need modification, set both 'original' and 'modified' to null.

Example response format:

{
  "js": {
    "original": null,
    "modified": "// Only the modified function section of JavaScript code"
  },
  "html": {
    "original": null,
    "modified": "<!-- Only the modified part of HTML code -->"
  },
  "css": {
    "original": null,
    "modified": null
  }
}

Do not include any explanations or additional text outside of the JSON object.` }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    console.log('Received response from OpenAI API');
    if (response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      try {
        // Parse the content as JSON
        const updatedCode = JSON.parse(content);
        
        // Merge partial updates
        const mergedCode = {
          js: mergePartialUpdate(code, updatedCode.js.modified),
          html: mergePartialUpdate(htmlCode, updatedCode.html.modified),
          css: mergePartialUpdate(cssCode, updatedCode.css.modified)
        };
        
        res.json({ updatedCode: mergedCode });
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        console.log("Raw response content:", content);
        
        // Attempt to extract JSON from the content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[0]);
            res.json({ updatedCode: extractedJson });
          } catch (extractError) {
            console.error("Error extracting JSON from content:", extractError);
            res.status(500).json({ 
              error: 'Error parsing OpenAI response', 
              details: content,
              rawContent: content 
            });
          }
        } else {
          res.status(500).json({ 
            error: 'Error parsing OpenAI response', 
            details: 'No valid JSON found in the response',
            rawContent: content 
          });
        }
      }
    } else {
      console.error("Unexpected response format from OpenAI API:", response.data);
      res.status(500).json({ error: 'Unexpected response format from OpenAI API' });
    }
  } catch (error) {
    console.error('Error in /llm-chat:', error);
    if (error.response) {
      console.error('OpenAI API response:', error.response.data);
      res.status(error.response.status).json({ error: 'Error processing LLM chat request', details: error.response.data });
    } else {
      res.status(500).json({ error: 'Error processing LLM chat request', details: error.message });
    }
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});