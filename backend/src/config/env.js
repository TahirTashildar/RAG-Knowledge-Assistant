require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV !== 'test') {
    throw new Error(`[configuration] Missing required environment variable: ${name}`);
  }
  return value;
}

function requiredUrl(name) {
  const value = required(name);
  if (!value || process.env.NODE_ENV === 'test') return value;

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch {
    throw new Error(`[configuration] ${name} must be a valid HTTP(S) URL`);
  }
  return value.replace(/\/+$/, '');
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  ragServiceUrl: requiredUrl('RAG_SERVICE_URL'),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB || 20),
  internalServiceToken: required('INTERNAL_SERVICE_TOKEN'),
};
