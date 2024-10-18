 
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();  
 
const app = express();

 
app.use(cors()); //   CORS for cross-origin requests
app.use(bodyParser.json());  

 
function mergePartialUpdate(original, update) {
  if (!update || update === original) return original;

  const originalLines = original.split('\n');
  const updateLines = update.split('\n');

  
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < originalLines.length; i++) {
    if (originalLines[i].trim() === updateLines[0].trim()) {
      startIndex = i;
      endIndex = i + updateLines.length;
      break;
    }
  }

  // If we couldn't find the exact match, fall back 
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
    const { code, htmlCode, cssCode } = req.body; // Retrieve all code sections from the request body

    if (!code || !htmlCode || !cssCode) {
        console.error("All code sections must be provided.");
        return res.status(400).send('All code sections must be provided.');
    }

    try {
        console.log("Received code:", code);
        console.log("Received HTML:", htmlCode);
        console.log("Received CSS:", cssCode);

        // Request data for the OpenAI API
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that generates flowcharts.' },
                    { role: 'user', content: `Create a flowchart in Mermaid syntax that includes the structure of the following code sections and their connections:
                    
                    JavaScript:
                    ${code}

                    HTML:
                    ${htmlCode}

                    CSS:
                    ${cssCode}

                    Use larger blocks to mark out the three sections corresponding to JavaScript, HTML, and CSS, and use arrows to indicate their interconnections. Only output the raw Mermaid code.
                

                    Only output the raw Mermaid code. 
                    Do not include any ( or ) or any quotation marks.
                    Do not include sentences like "This flowchart represents the steps the  code is taking and how it flows from one execution to another." Do not start with the word "mermaid". Just start with raw code and end with raw code. Example:
                      you MUST follow the stucture provided in the sample output below! start with graph TD and using subgraph to divided HTML, CSS and JS section and create logic between them!!!use arrow and logic in between to show how the function in different file connect to each other!!!! Make sure the mermaid syntax is correct!
                      graph TD 
                      subgraph HTML Section 
                          A[Canvas Element] 
                          B[Script Element] 
                      end

                      subgraph CSS Section
                          C[Canvas Styles]
                          D[SVG Styles]
                      end

                      subgraph JavaScript Section
                          E[Global Constants]
                          F[Create Flower Function]
                          F1[Grow Function]
                          F2[Drop Function]
                          F3[Transform Function]
                          F4[Step Function]
                          F5[Delete Function]
                          G[Shade RGB Color Function]
                          H[Animate Flowers Function]
                          I[Draw Branch Function]
                          J[Draw Tree Function]
                          K[Initialization]
                      end

                      A -->|Interacts with| F
                      B -->|Loads| K
                      C -->|Styles Canvas| A
                      D -->|Styles SVG| F
                      E -->|Provides Constants| F
                      E -->|Provides Constants| G
                      F -->|Manages Flower Logic| H
                      F1 -->|Handles Growth| F3
                      F2 -->|Handles Drop| F3
                      F3 -->|Transforms Flower| F4
                      F4 -->|Manages State| F5
                      F5 -->|Removes Flower| H
                      G -->|Adjusts Colors| I
                      H -->|Controls Flower Animation| I
                      I -->|Draws Branches| J
                      J -->|Draws Tree Structure| K

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
            const cleanedMermaidSyntax = mermaidSyntax.replace(/```mermaid|```/g, '').trim();
            console.log("Generated Mermaid syntax:", cleanedMermaidSyntax);
            res.json({ mermaid: cleanedMermaidSyntax });
        } else {
            console.error("Unexpected response format from OpenAI API:", response.data);
            res.status(500).send('Error: Unexpected response format from OpenAI API.');
        }
    } catch (error) {
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