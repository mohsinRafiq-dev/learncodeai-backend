import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('Available Gemini Models:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.models) {
    console.log('\n\nModels that support generateContent:');
    data.models.forEach(model => {
      if (model.supportedGenerationMethods?.includes('generateContent')) {
        console.log(`- ${model.name}`);
      }
    });
  }
}

listModels().catch(console.error);
