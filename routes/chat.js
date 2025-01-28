const axios = require('axios');

const TALKJS_API_KEY = process.env.TALKJS_API_KEY;
const APP_ID = process.env.TALKJS_APP_ID;
const BASE_URL = `https://api.talkjs.com/v1/${APP_ID}`;

const app = require("express").Router();

// Axios instance for making requests
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TALKJS_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Helper function to handle responses
const handleResponse = (response) => {
  if (response.status === 200) {
    return response.data;
  } else {
    throw new Error(`TalkJS API Error: ${response.status} - ${response.data}`);
  }
};

app.get("/", (req, res) => res.send("Express on Vercel"));

// Endpoint to create or update a user
app.put('/create_or_update_user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const body = req.body;
    const response = await axiosInstance.put(`/users/${userId}`, body);
    res.json(handleResponse(response));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to update participation
app.patch('/conversations/:conversationId/participants/:userId', async (req, res) => {
  try {
    const { conversationId, userId } = req.params;
    const body = req.body;
    const response = await axiosInstance.patch(`/conversations/${conversationId}/participants/${userId}`, body);
    res.json(handleResponse(response));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to create or update a user
app.get('/get_group_members/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const body = req.body;

    const allUsers = (await axiosInstance.get(`/users`)).data;
    const conversation = (await axiosInstance.get(`/conversations/${conversationId}`)).data;

    const participantIds = Object.keys(conversation.participants || {});

    const users = allUsers.data.filter(user=> participantIds.includes(user.id));

    const response = users.map(user=>{
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        photoUrl: user.photoUrl
      }
    });
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Endpoint to create or update a user
app.get('/list_messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const response = await axiosInstance.get(`/conversations/${conversationId}/messages`);
    res.json(handleResponse(response));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// leave the group
app.delete('/leave_group/:conversationId/:userId', async (req, res) => {
  try {
    const { userId, conversationId } = req.params;
    const response = await axiosInstance.delete(`/conversations/${conversationId}/participants/${userId}`);
    res.json(handleResponse(response));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to create or update a conversation
app.put('/create_or_update_conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const body = req.body;
    const response = await axiosInstance.put(`/conversations/${conversationId}`, body);
    res.json(handleResponse(response));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get a conversation
app.get('/get_conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const response = await axiosInstance.get(`/conversations/${conversationId}`);
    res.json(handleResponse(response));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to delete a conversation
app.delete('/delete_conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const response = await axiosInstance.delete(`/conversations/${conversationId}`);
    res.json(handleResponse(response));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get public groups
app.get('/get_public_groups', async (req, res) => {
  try {
    const filter = {
      custom: {
        type: ['==', 'group'],
        privacy: ['==', 'public'],
      },
    };
    const encodedFilter = encodeURIComponent(JSON.stringify(filter));
    const response = await axiosInstance.get(`/conversations?filter=${encodedFilter}`);
    const data = handleResponse(response).data;

    const finalResponse = data.map((conversation) => ({
      conversationId: conversation.id,
      subject: conversation.subject,
      createdAt: conversation.createdAt,
      participants: Object.keys(conversation.participants),
      adminId: conversation.custom?.adminId,
      title: conversation.custom?.title,
      photoUrl: conversation.photoUrl,
    }));

    res.json(finalResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get a user's groups
app.get('/get_my_groups/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const filter = {
      custom: {
        type: ['==', 'group'],
      },
    };
    const encodedFilter = encodeURIComponent(JSON.stringify(filter));
    const response = await axiosInstance.get(`/users/${userId}/conversations?filter=${encodedFilter}`);
    const data = handleResponse(response).data;

    const finalResponse = data.map((conversation) => ({
      conversationId: conversation.id,
      subject: conversation.subject,
      createdAt: conversation.createdAt,
      participants: Object.keys(conversation.participants),
      adminId: conversation.custom?.adminId,
      title: conversation.custom?.title,
      photoUrl: conversation.photoUrl,
    }));

    res.json(finalResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get a user's friends
app.get('/get_my_friends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const filter = {
      custom: {
        type: ['==', 'direct'],
      },
    };
    const encodedFilter = encodeURIComponent(JSON.stringify(filter));
    const response = await axiosInstance.get(`/users/${userId}/conversations?filter=${encodedFilter}`);
    const data = handleResponse(response).data;

     const allUsers = (await axiosInstance.get(`/users`)).data;


    const finalResponse = await Promise.all(
      data.map(async (conversation) => {
        const participantIds = Object.keys(conversation.participants);
        const otherParticipantIds = participantIds.filter(id => id !== userId);

       const otherParticipant = allUsers.data.find(user=> user.id === otherParticipantIds[0]);
        
        return {
          conversationId: conversation.id,
          friend: {
            id: otherParticipant.id,
            name: otherParticipant.name,
            role: otherParticipant.role,
            photoUrl: otherParticipant.photoUrl
          },
        };
      })
    );

    res.json(finalResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
