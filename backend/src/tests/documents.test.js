const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { MongoMemoryServer } = require('mongodb-memory-server');
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
});

async function registerUser(email) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test User', email, password: 'supersecret123' });
  return res.body.data.token;
}

function tempFile(name, content) {
  const filePath = path.join(os.tmpdir(), name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe('Document upload', () => {
  it('rejects upload without authentication', async () => {
    const res = await request(app).post('/api/documents');
    expect(res.status).toBe(401);
  });

  it('rejects an unsupported file type', async () => {
    const token = await registerUser('user1@example.com');
    const filePath = tempFile('notes.exe', 'not a real doc');

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', filePath, { contentType: 'application/octet-stream' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unsupported file type/i);
  });

  it('accepts a .txt upload, creates metadata, and starts processing', async () => {
    const token = await registerUser('user2@example.com');
    const filePath = tempFile('notes.txt', 'hello world, this is a test document');

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', filePath, { contentType: 'text/plain' });

    expect(res.status).toBe(201);
    expect(res.body.data.document.filename).toBe('notes.txt');
    expect(res.body.data.document.fileType).toBe('txt');
    expect(['UPLOADING', 'PROCESSING']).toContain(res.body.data.document.processingStatus);
  });

  it('never returns another user\'s documents', async () => {
    const tokenA = await registerUser('userA@example.com');
    const tokenB = await registerUser('userB@example.com');
    const filePath = tempFile('a-doc.txt', 'content belonging to user A');

    const uploadRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('file', filePath, { contentType: 'text/plain' });
    const docId = uploadRes.body.data.document._id;

    // User B must not be able to fetch it directly...
    const getRes = await request(app).get(`/api/documents/${docId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(getRes.status).toBe(404);

    // ...nor see it in their own list.
    const listRes = await request(app).get('/api/documents').set('Authorization', `Bearer ${tokenB}`);
    expect(listRes.body.data.documents).toHaveLength(0);

    // User A can see and fetch their own.
    const ownListRes = await request(app).get('/api/documents').set('Authorization', `Bearer ${tokenA}`);
    expect(ownListRes.body.data.documents).toHaveLength(1);
  });

  it('returns 404 (not 403) when deleting a document owned by someone else', async () => {
    const tokenA = await registerUser('userC@example.com');
    const tokenB = await registerUser('userD@example.com');
    const filePath = tempFile('c-doc.txt', 'content belonging to user C');

    const uploadRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('file', filePath, { contentType: 'text/plain' });
    const docId = uploadRes.body.data.document._id;

    const deleteRes = await request(app)
      .delete(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(deleteRes.status).toBe(404);
  });
});
