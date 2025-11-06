import path from 'path';

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '0';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecom-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
process.env.COOKIE_NAME = process.env.COOKIE_NAME || 'test_cookie';
process.env.COOKIE_SECURE = process.env.COOKIE_SECURE || 'false';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || path.join('tmp', 'uploads-test');
