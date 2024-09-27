#!/bin/bash

# Create the directory structure
mkdir -p js-to-mermaid-app/server
mkdir -p js-to-mermaid-app/client/src
mkdir -p js-to-mermaid-app/client/public

# Navigate to the server directory
cd js-to-mermaid-app/server
echo "Setting up Node.js server..."

# Initialize Node.js project
npm init -y

# Install necessary packages
npm install express axios body-parser cors dotenv

# Create index.js for server
cat <<EOL > index.js
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

  try {
    // Request data for the OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: \`Create a flowchart in Mermaid syntax for the following JavaScript code: \${userCode}\` }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${process.env.OPENAI_API_KEY}\` // Use the API key from environment variables
        }
      }
    );

    // Extract the Mermaid syntax from the response
    const mermaidSyntax = response.data.choices[0].message.content;

    // Send the Mermaid syntax back to the frontend
    res.json({ mermaid: mermaidSyntax });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating flowchart.');
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
EOL

# Create .env file
cat <<EOL > .env
OPENAI_API_KEY=your_openai_api_key
EOL

# Navigate to the client directory
cd ../client
echo "Setting up React app..."

# Create React app
npx create-react-app .

# Install axios
npm install axios

# Copy necessary files
cat <<EOL > src/App.js
// Import required React modules
import React, { useState } from 'react';
import axios from 'axios';
import './styles.css'; // Import custom styles

// Main App component
const App = () => {
  const [code, setCode] = useState(''); // State for user input code
  const [mermaidCode, setMermaidCode] = useState(''); // State for Mermaid syntax

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const response = await axios.post('http://localhost:5000/generate-flowchart', { code });
      setMermaidCode(response.data.mermaid); // Update the state with received Mermaid code
    } catch (error) {
      console.error('Error generating flowchart:', error);
    }
  };

  // Render the app UI
  return (
    <div className="app-container">
      <h1>JavaScript to Flowchart Generator</h1>
      <div className="input-container">
        <textarea
          placeholder="Paste your JavaScript code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button onClick={handleSubmit}>Generate Flowchart</button>
      </div>
      <div className="output-container">
        <h2>Flowchart Preview</h2>
        <div className="mermaid">
          <div className="mermaid-code">{mermaidCode}</div>
          <div dangerouslySetInnerHTML={{ __html: mermaidCode }} />
        </div>
      </div>
    </div>
  );
};

export default App;
EOL

cat <<EOL > src/styles.css
/* Basic styling */
.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.input-container {
  margin-bottom: 20px;
}

textarea {
  width: 600px;
  height: 200px;
  margin-right: 10px;
}

button {
  padding: 10px;
}

.output-container {
  margin-top: 20px;
  width: 100%;
}

.mermaid {
  margin-top: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
}
EOL

cat <<EOL > src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
EOL

cat <<EOL > public/index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JS to Flowchart</title>
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/mermaid/dist/mermaid.min.js"></script>
</body>
</html>
EOL

echo "Setup complete! To start the app, run 'npm start' inside the client folder and 'node index.js' in the server folder."
