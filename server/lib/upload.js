import fs from 'fs';
import path from 'path';
import multer from 'multer';

const { promises: fsPromises } = fs;

const uploadsRoot = process.env.UPLOAD_DIR
  ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), 'uploads');

fs.mkdirSync(uploadsRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsRoot),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = (file.originalname && path.extname(file.originalname)) || '';
    const base = (file.originalname || 'upload')
      .replace(ext, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
    const safeBase = base || 'image';
    cb(null, `${timestamp}-${random}-${safeBase}${ext.toLowerCase()}`);
  },
});

function imageFilter(_req, file, cb) {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    cb(new Error('Only image uploads are allowed'));
  } else {
    cb(null, true);
  }
}

export const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: Number(process.env.UPLOAD_MAX_SIZE || 5 * 1024 * 1024),
  },
});

export const uploadDir = uploadsRoot;

export function toPublicUrl(file) {
  if (!file) return '';
  return path.posix.join('/uploads', file.filename);
}

export function mapUploadedFiles(files) {
  if (!files) return [];
  if (Array.isArray(files)) return files.map(toPublicUrl);
  return Object.values(files).flat().map(toPublicUrl);
}

function ensureArray(input) {
  if (!input) return [];
  return Array.isArray(input) ? input : [input];
}

export function resolveUploadPath(url) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) return null;
  const relative = url.replace(/^\/+/, '');
  if (!relative.startsWith('uploads/')) return null;
  const subPath = relative.slice('uploads/'.length);
  if (!subPath) return null;
  const absolute = path.resolve(uploadsRoot, subPath);
  if (!absolute.startsWith(uploadsRoot)) return null;
  return absolute;
}

async function deleteIfExists(filePath) {
  if (!filePath) return;
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // eslint-disable-next-line no-console
      console.warn('Failed to delete upload', filePath, error.message);
    }
  }
}

export async function cleanupReplacedUploads(previousValues, nextValues) {
  const previousPaths = new Set(
    ensureArray(previousValues)
      .map(resolveUploadPath)
      .filter(Boolean)
  );
  const nextPaths = new Set(
    ensureArray(nextValues)
      .map(resolveUploadPath)
      .filter(Boolean)
  );

  const toDelete = [...previousPaths].filter((filePath) => !nextPaths.has(filePath));
  await Promise.allSettled(toDelete.map(deleteIfExists));
}

export async function removeUploads(values) {
  const paths = ensureArray(values)
    .map(resolveUploadPath)
    .filter(Boolean);
  await Promise.allSettled(paths.map(deleteIfExists));
}
