const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock the RAG client boundary — FastAPI/Hugging Face/ChromaDB are external
// services this test suite cannot call. Everything on the Express side
// (ownership, message persistence, bounded history composition) is real.
jest.mock('../services/ragServiceClient', () => ({
  ...jest.requireActual('../services/ragServiceClient'),
  queryRag: jest.fn(),
}));
const { queryRag } = require('../services/ragServiceClient');
const app = require('../app');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
  jest.clearAllMocks();
});

async function registerUser(email) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test User', email, password: 'supersecret123' });
  return res.body.data.token;
}

describe('Conversations', () => {
  it('creates and lists a conversation for the authenticated user only', async () => {
    const tokenA = await registerUser('convA@example.com');
    const tokenB = await registerUser('convB@example.com');

    await request(app).post('/api/conversations').set('Authorization', `Bearer ${tokenA}`).send({ title: 'Paper Q&A' });

    const listA = await request(app).get('/api/conversations').set('Authorization', `Bearer ${tokenA}`);
    expect(listA.body.data.conversations).toHaveLength(1);

    const listB = await request(app).get('/api/conversations').set('Authorization', `Bearer ${tokenB}`);
    expect(listB.body.data.conversations).toHaveLength(0);
  });

  it('returns 404 fetching another user\'s conversation', async () => {
    const tokenA = await registerUser('convC@example.com');
    const tokenB = await registerUser('convD@example.com');

    const createRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Private' });
    const convId = createRes.body.data.conversation._id;

    const res = await request(app).get(`/api/conversations/${convId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('sends a message, persists both user and assistant messages with sources, and uses bounded history', async () => {
    const token = await registerUser('convE@example.com');
    const createRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Research' });
    const convId = createRes.body.data.conversation._id;

    queryRag.mockResolvedValueOnce({
      data: {
        answer: 'The paper found X.',
        sources: [
          {
            documentId: 'doc1',
            documentName: 'paper.pdf',
            pageNumber: 4,
            chunkId: 'chunk1',
            chunkText: 'X was found to be true.',
            relevanceScore: 0.91,
          },
        ],
        mode: 'STANDARD',
      },
    });

    const res = await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'What did the paper find?' });

    expect(res.status).toBe(201);
    expect(res.body.data.assistantMessage.content).toBe('The paper found X.');
    expect(res.body.data.assistantMessage.sources).toHaveLength(1);
    expect(res.body.data.assistantMessage.sources[0].documentName).toBe('paper.pdf');

    // queryRag was called with the composed question, not just raw content
    expect(queryRag).toHaveBeenCalledWith(
      expect.objectContaining({ userId: expect.any(String), question: expect.stringContaining('What did the paper find?') })
    );

    const messagesRes = await request(app)
      .get(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${token}`);
    expect(messagesRes.body.data.messages).toHaveLength(2); // user + assistant
  });

  it('stores an honest error message when the RAG service call fails', async () => {
    const token = await registerUser('convF@example.com');
    const createRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Research' });
    const convId = createRes.body.data.conversation._id;

    queryRag.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));

    const res = await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'What did the paper find?' });

    expect(res.status).toBe(201); // the HTTP call itself succeeds...
    expect(res.body.data.assistantMessage.content).toMatch(/couldn't generate an answer/i);
    expect(res.body.data.assistantMessage.content).toMatch(/ECONNREFUSED/);
  });

  it('rejects sending a message to another user\'s conversation', async () => {
    const tokenA = await registerUser('convG@example.com');
    const tokenB = await registerUser('convH@example.com');
    const createRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Private' });
    const convId = createRes.body.data.conversation._id;

    const res = await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'Hijack attempt' });
    expect(res.status).toBe(404);
    expect(queryRag).not.toHaveBeenCalled();
  });
});
