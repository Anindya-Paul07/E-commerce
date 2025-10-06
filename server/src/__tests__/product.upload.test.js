import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Product from '../model/product.model.js';
import { create, update, remove } from '../controller/product.controller.js';
import { uploadDir } from '../lib/upload.js';

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockNext() {
  return jest.fn();
}

async function ensureUploadsDirClean() {
  await fs.promises.mkdir(uploadDir, { recursive: true });
  const entries = await fs.promises.readdir(uploadDir);
  await Promise.all(entries.map((entry) => fs.promises.rm(path.join(uploadDir, entry), { recursive: true, force: true })));
}

describe('product controller uploads', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'test-product-uploads' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
    await fs.promises.rm(uploadDir, { recursive: true, force: true }).catch(() => {});
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await ensureUploadsDirClean();
  });

  test('create merges remote URLs with uploaded files', async () => {
    const req = {
      body: {
        title: 'Multipart Product',
        price: '19.99',
        stock: '5',
        images: JSON.stringify(['https://cdn.example.com/remote.jpg']),
        tags: JSON.stringify(['featured']),
        categories: JSON.stringify([]),
      },
      files: [
        { filename: 'uploaded-a.jpg' },
        { filename: 'uploaded-b.jpg' },
      ],
    };

    const res = mockResponse();
    const next = mockNext();

    await create(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);

    const saved = await Product.findOne({ title: 'Multipart Product' }).lean();
    expect(saved).toBeTruthy();
    expect(saved.images).toEqual(
      expect.arrayContaining([
        'https://cdn.example.com/remote.jpg',
        '/uploads/uploaded-a.jpg',
        '/uploads/uploaded-b.jpg',
      ])
    );
  });

  test('update replaces uploads and removes old files', async () => {
    const previousFilename = 'old-image.jpg';
    const previousPath = path.join(uploadDir, previousFilename);
    await fs.promises.writeFile(previousPath, 'old image');

    const product = await Product.create({
      title: 'Clean Up Product',
      slug: 'clean-up-product',
      price: 25,
      stock: 10,
      images: [`/uploads/${previousFilename}`],
    });

    const newFilename = 'new-upload.jpg';
    await fs.promises.writeFile(path.join(uploadDir, newFilename), 'new image');

    const req = {
      params: { id: product._id.toString() },
      body: {
        price: '29.99',
        images: JSON.stringify(['https://cdn.example.com/hero.jpg']),
      },
      files: [{ filename: newFilename }],
    };

    const res = mockResponse();
    const next = mockNext();

    await update(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();

    const updated = await Product.findById(product._id).lean();
    expect(updated.images).toEqual(
      expect.arrayContaining(['/uploads/new-upload.jpg', 'https://cdn.example.com/hero.jpg'])
    );
    await expect(fs.promises.access(previousPath)).rejects.toThrow();
    await expect(fs.promises.access(path.join(uploadDir, newFilename))).resolves.toBeUndefined();
  });

  test('remove deletes associated uploads', async () => {
    const filename = 'remove-me.jpg';
    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, 'to delete');

    const product = await Product.create({
      title: 'Delete Product',
      slug: 'delete-product',
      price: 15,
      stock: 0,
      images: [`/uploads/${filename}`],
    });

    const req = { params: { id: product._id.toString() } };
    const res = mockResponse();
    const next = mockNext();

    await remove(req, res, next);

    expect(next).not.toHaveBeenCalled();
    await expect(fs.promises.access(filePath)).rejects.toThrow();
  });
});
