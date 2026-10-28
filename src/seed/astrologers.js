
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Astrologer from '../models/Astrologer.js';
import { generateAstrologers } from './generate.js';
import { slugify } from '../utils/index.js';

// ==========================================
// IMAGE CONFIGURATION
// ==========================================

const COVER_IMAGE =
  'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1400&q=70';

const getProfileImage = (gender, index) => {
  const imageNumber = (index % 99) + 1;

  if (gender === 'FEMALE') {
    return `https://randomuser.me/api/portraits/women/${imageNumber}.jpg`;
  }

  return `https://randomuser.me/api/portraits/men/${imageNumber}.jpg`;
};

// ==========================================
// SIX MANUAL ASTROLOGERS
// ==========================================

const base = [
  {
    name: 'Rahul Sharma',
    title: 'Love & Relationship Expert',
    gender: 'MALE',
    bio: 'Rahul Sharma has spent 15 years helping people through relationship doubts, breakups and delayed marriages. He combines Vedic birth-chart analysis with calm, practical advice you can act on. His sessions focus on timing, compatibility and what to do next.',
    experience: 15,
    specialization: ['Love', 'Relationship', 'Marriage'],
    languages: ['Hindi', 'English'],
    rating: 4.9,
    reviewCount: 1284,
    totalConsultations: 9650,
    onlineStatus: 'ONLINE',
    isVerified: true,
    chatPrice10Min: 199,
    chatPrice30Min: 499,
    chatPrice60Min: 799,
    callPrice10Min: 299,
    callPrice30Min: 699,
    callPrice60Min: 999
  },
  {
    name: 'Priya Verma',
    title: 'Career & Finance Guide',
    gender: 'FEMALE',
    bio: 'Priya Verma reads dasha periods to help professionals choose when to switch jobs, ask for a promotion or invest. With 12 years of practice she is known for clear, structured readings and honest timelines.',
    experience: 12,
    specialization: ['Career', 'Finance', 'Business'],
    languages: ['Hindi', 'English', 'Punjabi'],
    rating: 4.8,
    reviewCount: 972,
    totalConsultations: 7420,
    onlineStatus: 'ONLINE',
    isVerified: true,
    chatPrice10Min: 249,
    chatPrice30Min: 599,
    chatPrice60Min: 999,
    callPrice10Min: 349,
    callPrice30Min: 799,
    callPrice60Min: 1299
  },
  {
    name: 'Amit Joshi',
    title: 'Marriage & Family Counsellor',
    gender: 'MALE',
    bio: 'Amit Joshi comes from a family of traditional jyotishis and has guided families on marriage timing, kundli compatibility and household harmony.',
    experience: 22,
    specialization: ['Marriage', 'Family', 'Relationship'],
    languages: ['Hindi', 'Gujarati', 'Marathi'],
    rating: 4.7,
    reviewCount: 1530,
    totalConsultations: 12110,
    onlineStatus: 'BUSY',
    isVerified: true,
    chatPrice10Min: 299,
    chatPrice30Min: 699,
    chatPrice60Min: 1199,
    callPrice10Min: 399,
    callPrice30Min: 899,
    callPrice60Min: 1499
  },
  {
    name: 'Neha Sharma',
    title: 'Business & Finance Astrologer',
    gender: 'FEMALE',
    bio: 'Neha Sharma advises founders and shop owners on launch dates, partnerships and business cycles. Her experience combines planetary transits with practical business guidance.',
    experience: 8,
    specialization: ['Business', 'Finance', 'Career'],
    languages: ['Hindi', 'English'],
    rating: 4.6,
    reviewCount: 518,
    totalConsultations: 3890,
    onlineStatus: 'ONLINE',
    isVerified: true,
    chatPrice10Min: 149,
    chatPrice30Min: 399,
    chatPrice60Min: 699,
    callPrice10Min: 249,
    callPrice30Min: 599,
    callPrice60Min: 899
  },
  {
    name: 'Anjali Singh',
    title: 'Family & Life Guidance',
    gender: 'FEMALE',
    bio: 'Anjali Singh offers listening-first consultations on family conflicts, parenting worries and major life decisions.',
    experience: 18,
    specialization: ['Family', 'Marriage', 'Love'],
    languages: ['Hindi', 'English', 'Bengali', 'Punjabi'],
    rating: 4.9,
    reviewCount: 1105,
    totalConsultations: 8870,
    onlineStatus: 'OFFLINE',
    isVerified: true,
    chatPrice10Min: 249,
    chatPrice30Min: 649,
    chatPrice60Min: 1099,
    callPrice10Min: 349,
    callPrice30Min: 849,
    callPrice60Min: 1399
  },
  {
    name: 'Rohit Mehta',
    title: 'Career & Business Strategist',
    gender: 'MALE',
    bio: 'Rohit Mehta specialises in career-change timing for young professionals and first-time entrepreneurs.',
    experience: 5,
    specialization: ['Career', 'Business', 'Love'],
    languages: ['Hindi', 'English', 'Marathi'],
    rating: 4.5,
    reviewCount: 241,
    totalConsultations: 1760,
    onlineStatus: 'ONLINE',
    isVerified: false,
    chatPrice10Min: 99,
    chatPrice30Min: 299,
    chatPrice60Min: 499,
    callPrice10Min: 149,
    callPrice30Min: 399,
    callPrice60Min: 699
  }
].map((astrologer, index) => ({
  ...astrologer,
  slug: slugify(astrologer.name),
  profileImage: getProfileImage(astrologer.gender, index + 1),
  coverImage: COVER_IMAGE,
  gallery: [],
  isActive: true
}));

// ==========================================
// GENERATE 104 ADDITIONAL PROFILES
// ==========================================

const generated = generateAstrologers(104, base);

// Assign deterministic image URLs to generated profiles.
// The same gender may reuse portraits when the index cycles.
const generatedWithImages = generated.map((astrologer, index) => {
  const imageIndex = index + base.length + 1;

  return {
    ...astrologer,
    profileImage: getProfileImage(astrologer.gender, imageIndex),
    coverImage: COVER_IMAGE,
    gallery: [],
    isActive: true
  };
});

// ==========================================
// COMBINE AND VALIDATE
// ==========================================

const data = [
  ...base,
  ...generatedWithImages
];

if (data.length !== 110) {
  throw new Error(
    `Expected 110 astrologers, generated ${data.length}.`
  );
}

const slugs = data.map((astrologer) => astrologer.slug);

if (new Set(slugs).size !== slugs.length) {
  throw new Error('Duplicate astrologer slugs found.');
}

const missingImages = data.filter(
  (astrologer) =>
    !astrologer.profileImage || !astrologer.coverImage
);

if (missingImages.length > 0) {
  throw new Error(
    `${missingImages.length} profiles are missing image URLs.`
  );
}

// ==========================================
// DATABASE SEEDING
// ==========================================

try {
  await connectDB();

  const result = await Astrologer.bulkWrite(
    data.map((astrologer) => ({
      updateOne: {
        filter: {
          slug: astrologer.slug
        },
        update: {
          $set: astrologer
        },
        upsert: true
      }
    }))
  );

  console.log('================================');
  console.log('ASTROLOGER SEED COMPLETED');
  console.log('Total profiles:', data.length);
  console.log('Profiles with image URLs:', data.filter((a) => a.profileImage).length);
  console.log('Inserted:', result.upsertedCount);
  console.log('Updated:', result.modifiedCount);
  console.log('================================');

} catch (error) {
  console.error('Astrologer seed failed:', error);
  process.exitCode = 1;

} finally {
  await mongoose.connection.close();
}
