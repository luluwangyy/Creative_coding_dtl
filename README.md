# Creative Coding DTL

This project is built using a React frontend and Node.js backend structure.

## Getting Started

To get started with this project, follow these steps:

### Prerequisites

- Node.js and npm installed on your machine
- An OpenAI API key

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/creative_coding_dtl.git
   cd creative_coding_dtl
   ```

2. Set up the client:
   ```
   cd client
   npm install
   ```

3. Add your OpenAI API key:
   - In the `client` folder, 
   - Add your OpenAI API key to the `.env` file:
     ```
      OPENAI_API_KEY=your_api_key_here
     ```

4. Set up the server:
   ```
   cd ../server
   npm install
   ```

## Running the Application

1. Start the client:
   ```
   cd client
   npm start
   ```
   This will run the React frontend, typically on `http://localhost:3000`.

2. In a new terminal, start the server:
   ```
   cd server
   node index.js
   ```
   This will start the Node.js backend.
