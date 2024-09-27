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
          { role: 'user', content: `Create a flowchart in Mermaid syntax for the following JavaScript code: ${userCode}. Generate only the Mermaid syntax flowchart. Do not include any explanations, introductions, or additional text. Only output the raw Mermaid code. Do not include sentences like "This flowchart represents the steps the JavaScript code is taking and how it flows from one execution to another." Do not start with the word "mermaid". Just start with raw code and end with raw code. Example:
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

      // {{ edit_1 }} - Extract output without ''' and 'mermaid'
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

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
