// import {
//     GoogleGenerativeAI,
//     HarmCategory,
//     HarmBlockThreshold,
//   } from "@google/generative-ai";
  
//   const apiKey = "AIzaSyBJWK1kMs4SDGpV0NDk7UQs-k5Ggzf2DQM";
//   const genAI = new GoogleGenerativeAI(apiKey);
  
//   const model = genAI.getGenerativeModel({
//     model: "gemini-2.0-flash",
//   });
  
//   const generationConfig = {
//     temperature: 1,
//     topP: 0.95,
//     topK: 40,
//     maxOutputTokens: 8192,
//     responseMimeType: "text/plain",
//   };
  
//   // Handle file upload
//   const uploadFile = async (file) => {
//     const formData = new FormData();
//     formData.append("file", file);
  
  
//     const response = await fetch("YOUR_GEMINI_API_ENDPOINT", {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${apiKey}`,
//       },
//       body: formData,
//     });
  
//     const data = await response.json();
//     return data; // Process response accordingly
//   };
  
//   async function run(prompt, file = null) {  //prompt is getting us our input or queries 
//     const chatSession = model.startChat({
//       generationConfig,
//       history: [],
//     });
  
//     let result;
//     if (file) {
//       // If file is provided (image or video), upload it
//       //logic for video processing
//       try {
//         const fileData = await uploadFile(file);
//         result = await chatSession.sendMessage(`Analyze this file: ${fileData}`);
//       } catch (error) {
//         console.error("Error uploading file:", error);
//         return;
//       }
//     } else {
//       // Proceed with regular text input
//       result = await chatSession.sendMessage(prompt);
//     } 
  
//     const response = result.response;
//     console.log(response.text());
//     return response.text();
//   }
  
//   export default run;
  