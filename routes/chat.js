const axios = require('axios');

const TALKJS_API_KEY = process.env.TALKJS_API_KEY;
const APP_ID = process.env.TALKJS_APP_ID;
const BASE_URL = `https://api.talkjs.com/v1/${APP_ID}`;

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
app.put('/api/v1/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const body = req.body;
    const response = await axiosInstance.put(`/users/${userId}`, body);
    res.json(handleResponse(response));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to create or update a conversation
app.put('/api/v1/conversations/:conversationId', async (req, res) => {
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
app.get('/api/v1/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const response = await axiosInstance.get(`/conversations/${conversationId}`);
    res.json(handleResponse(response));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to delete a conversation
app.delete('/api/v1/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const response = await axiosInstance.delete(`/conversations/${conversationId}`);
    res.json(handleResponse(response));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get public groups
app.get('/api/v1/conversations/public-groups', async (req, res) => {
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
    }));

    res.json(finalResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get a user's groups
app.get('/api/v1/users/:userId/groups', async (req, res) => {
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
app.get('/api/v1/users/:userId/friends', async (req, res) => {
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

    const finalResponse = await Promise.all(
      data.map(async (conversation) => {
        const participantIds = Object.keys(conversation.participants);
        const otherParticipantIds = participantIds.filter(id => id !== userId);
        // Replace this with your own logic to fetch user details
        const otherParticipant = { name: 'Friend Name', image: 'https://images.unsplash.com/photo-1737559217439-a5703e9b65cb?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw5OHx8fGVufDB8fHx8fA%3D%3D'}; // Mocked for now

        return {
          conversationId: conversation.id,
          friend: {
            name: otherParticipant.name,
            image: otherParticipant.image || null,
          },
        };
      })
    );

    res.json(finalResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
