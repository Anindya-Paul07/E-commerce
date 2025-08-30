import 'dotenv/config.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// load your User model
import User from './model/user.model.js';

const MONGO_URI = process.env.MONGO_URI 

async function main() {
  await mongoose.connect(MONGO_URI, { dbName: 'ecom' });

  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin1234';
  const name = 'Admin';

  const existing = await User.findOne({ email });
  if (existing) {
    if (!existing.roles.includes('admin')) {
      existing.roles.push('admin');
      await existing.save();
    }
    console.log('✅ Admin ensured:', email);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      roles: ['admin'],
    });
    console.log('✅ Admin created:', email, 'password:', password);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
