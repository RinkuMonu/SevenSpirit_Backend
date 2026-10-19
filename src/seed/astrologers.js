import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Astrologer from '../models/Astrologer.js';
import { slugify } from '../utils/index.js';
import { generateAstrologers } from './generate.js';

const cover = 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1400&q=70';
const pic = (g, n) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`;

const base = [
  {
    name: 'Rahul Sharma', title: 'Love & Relationship Expert', gender: 'MALE', profileImage: pic('men', 32),
    bio: 'Rahul Sharma has spent 15 years helping people through relationship doubts, breakups and delayed marriages. He combines Vedic birth-chart analysis with calm, practical advice you can act on. His sessions focus on timing, compatibility and what to do next.',
    experience: 15, specialization: ['Love', 'Relationship', 'Marriage'], languages: ['Hindi', 'English'],
    rating: 4.9, reviewCount: 1284, totalConsultations: 9650, onlineStatus: 'ONLINE', isVerified: true,
    chatPrice10Min: 199, chatPrice30Min: 499, chatPrice60Min: 799, callPrice10Min: 299, callPrice30Min: 699, callPrice60Min: 999,
  },
  {
    name: 'Priya Verma', title: 'Career & Finance Guide', gender: 'FEMALE', profileImage: pic('women', 44),
    bio: 'Priya Verma reads dasha periods to help professionals choose when to switch jobs, ask for a promotion or invest. With 12 years of practice she is known for clear, structured readings and honest timelines.',
    experience: 12, specialization: ['Career', 'Finance', 'Business'], languages: ['Hindi', 'English', 'Punjabi'],
    rating: 4.8, reviewCount: 972, totalConsultations: 7420, onlineStatus: 'ONLINE', isVerified: true,
    chatPrice10Min: 249, chatPrice30Min: 599, chatPrice60Min: 999, callPrice10Min: 349, callPrice30Min: 799, callPrice60Min: 1299,
  },
  {
    name: 'Amit Joshi', title: 'Marriage & Family Counsellor', gender: 'MALE', profileImage: pic('men', 52),
    bio: 'Amit Joshi comes from a family of traditional jyotishis and has guided over six thousand families on marriage timing, kundli-based compatibility questions and household harmony across 22 years.',
    experience: 22, specialization: ['Marriage', 'Family', 'Relationship'], languages: ['Hindi', 'Gujarati', 'Marathi'],
    rating: 4.7, reviewCount: 1530, totalConsultations: 12110, onlineStatus: 'BUSY', isVerified: true,
    chatPrice10Min: 299, chatPrice30Min: 699, chatPrice60Min: 1199, callPrice10Min: 399, callPrice30Min: 899, callPrice60Min: 1499,
  },
  {
    name: 'Neha Sharma', title: 'Business & Finance Astrologer', gender: 'FEMALE', profileImage: pic('women', 68),
    bio: 'Neha Sharma advises founders and shop owners on launch dates, partnerships and cash-flow cycles. Her 8 years of experience blend planetary transits with a practical business sense.',
    experience: 8, specialization: ['Business', 'Finance', 'Career'], languages: ['Hindi', 'English'],
    rating: 4.6, reviewCount: 518, totalConsultations: 3890, onlineStatus: 'ONLINE', isVerified: true,
    chatPrice10Min: 149, chatPrice30Min: 399, chatPrice60Min: 699, callPrice10Min: 249, callPrice30Min: 599, callPrice60Min: 899,
  },
  {
    name: 'Anjali Singh', title: 'Family & Life Guidance', gender: 'FEMALE', profileImage: pic('women', 25),
    bio: 'Anjali Singh offers gentle, listening-first consultations on family conflicts, parenting worries and major life decisions. She has practised for 18 years and speaks four languages.',
    experience: 18, specialization: ['Family', 'Marriage', 'Love'], languages: ['Hindi', 'English', 'Bengali', 'Punjabi'],
    rating: 4.9, reviewCount: 1105, totalConsultations: 8870, onlineStatus: 'OFFLINE', isVerified: true,
    chatPrice10Min: 249, chatPrice30Min: 649, chatPrice60Min: 1099, callPrice10Min: 349, callPrice30Min: 849, callPrice60Min: 1399,
  },
  {
    name: 'Rohit Mehta', title: 'Career & Business Strategist', gender: 'MALE', profileImage: pic('men', 75),
    bio: 'Rohit Mehta, 5 years into full-time practice, specialises in career-change timing for young professionals and first-time entrepreneurs. Affordable sessions with a straight-talking style.',
    experience: 5, specialization: ['Career', 'Business', 'Love'], languages: ['Hindi', 'English', 'Marathi'],
    rating: 4.5, reviewCount: 241, totalConsultations: 1760, onlineStatus: 'ONLINE', isVerified: false,
    chatPrice10Min: 99, chatPrice30Min: 299, chatPrice60Min: 499, callPrice10Min: 149, callPrice30Min: 399, callPrice60Min: 699,
  },
].map((a) => ({ ...a, slug: slugify(a.name), coverImage: cover, gallery: [], isActive: true }));

// 6 hand-written profiles + 104 generated demo profiles = 110 astrologers
const data = [...base, ...generateAstrologers(104, base)];

await connectDB();
const result = await Astrologer.bulkWrite(
  data.map((a) => ({ updateOne: { filter: { slug: a.slug }, update: { $set: a }, upsert: true } }))
);
console.log(`Seeded astrologers: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);
await mongoose.connection.close();
