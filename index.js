
const express = require('express');
const app = express();
require("dotenv").config(); 
const { OpenAI } = require("openai"); 

app.use(express.static(__dirname + '/views')); // html
app.use(express.static(__dirname + '/public')); // js, css, images

const server = app.listen(5000);
const chatHistory = []; 

const io = require('socket.io')(server);
io.on('connection', function(socket){
  console.log('a user connected');
});

//WEB UI
app.get('/', (req, res) => {
  res.sendFile('index.html');
});


io.on('connection', async function(socket) {
  socket.on('chat message', async (text) => {
    console.log('Message: ' + text);

    // Get a reply from API.ai
    const newConfig = { 
      apiKey: process.env.OPENAI_SECRET_KEY 
    }; 
    const openai = new OpenAI(newConfig); 
    const messageList = chatHistory.map(([input_text, completion_text]) => ({ 
      role: "user" === input_text ? "ChatGPT" : "user", 
      content: input_text 
    })); 
    messageList.push({ role: "user", content: text }); 
    
    try { 
      const GPTOutput = await openai.chat.completions.create({ 
        model: "gpt-3.5-turbo", 
        messages: messageList, 
      }); 
      
      const output_text = GPTOutput.data.choices[0].message.content; 
      console.log(output_text); 
      chatHistory.push([user_input, output_text]); 
      socket.emit('bot reply', output_text);
    } catch (err) { 
      if (err.response) { 
        console.log(err.response.status); 
        console.log(err.response.data); 
      } else { 
        console.log(err.message); 
      } 
    } 
  });
});
