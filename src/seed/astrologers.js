import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Astrologer from '../models/Astrologer.js';

// ---- Demo-data generator (deterministic: same output on every run) ----
// Deterministic demo-data generator (same output on every run, so re-seeding is idempotent).
const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const MALE = ['Aarav', 'Vivek', 'Sanjay', 'Manoj', 'Deepak', 'Karan', 'Suresh', 'Naveen', 'Pankaj', 'Harish', 'Mohit', 'Ashok', 'Gaurav', 'Nitin', 'Vikas', 'Yash', 'Pranav', 'Sandeep', 'Tarun', 'Mukesh', 'Rajesh', 'Kunal', 'Lalit', 'Girish', 'Devendra', 'Hemant', 'Ramesh', 'Shivam', 'Abhishek', 'Anil'];
const FEMALE = ['Kavita', 'Sunita', 'Pooja', 'Ritu', 'Swati', 'Meena', 'Shweta', 'Divya', 'Nisha', 'Radhika', 'Komal', 'Aditi', 'Seema', 'Tanvi', 'Isha', 'Bhavna', 'Lata', 'Mansi', 'Payal', 'Rekha', 'Shruti', 'Sonal', 'Vandana', 'Garima', 'Jyoti', 'Madhu', 'Namrata', 'Ruchi', 'Sarita', 'Usha'];
const LAST = ['Sharma', 'Verma', 'Joshi', 'Mehta', 'Singh', 'Gupta', 'Pandey', 'Mishra', 'Trivedi', 'Dubey', 'Bhatt', 'Agarwal', 'Chauhan', 'Rathore', 'Tiwari', 'Kapoor', 'Saxena', 'Pathak', 'Desai', 'Iyer', 'Nair', 'Reddy', 'Banerjee', 'Kulkarni', 'Shukla'];
const SPECS = ['Love', 'Marriage', 'Career', 'Business', 'Finance', 'Relationship', 'Family'];
const OTHER_LANGS = ['English', 'Punjabi', 'Gujarati', 'Marathi', 'Bengali', 'Tamil'];
const TITLES = {
  Love: 'Love & Relationship Expert', Marriage: 'Marriage Guidance Specialist', Career: 'Career Guidance Astrologer',
  Business: 'Business Astrology Advisor', Finance: 'Finance & Wealth Astrologer', Relationship: 'Relationship Counsellor', Family: 'Family & Life Guide',
};
const BIO = {
  Love: 'helps people understand feelings, compatibility and the right time to commit',
  Marriage: 'advises on marriage timing, compatibility and concerns before and after the wedding',
  Career: 'reads dasha periods to guide job changes, promotions and study choices',
  Business: 'guides founders and shop owners on launch dates, partnerships and growth cycles',
  Finance: 'looks at planetary cycles to advise on savings, investments and money decisions',
  Relationship: 'helps clients work through conflict, trust and communication with partners and family',
  Family: 'supports families through parenting worries, property matters and household harmony',
};
const cover = 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1400&q=70';
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
// Illustrated Indian-style avatars live in client/public/avatars (male-1..72.svg, female-1..72.svg).
// Each astrologer gets the next unused avatar for their gender.
const AVATARS_PER_GENDER = 72;
const avatarCount = { MALE: 0, FEMALE: 0 };
const nextAvatar = (gender) => {
  const key = gender === 'FEMALE' ? 'FEMALE' : 'MALE';
  const n = (avatarCount[key]++ % AVATARS_PER_GENDER) + 1;
  return `/avatars/${key === 'FEMALE' ? 'female' : 'male'}-${n}.svg`;
};
const price = (n) => Math.max(49, Math.round(n / 10) * 10 - 1); // 199, 249, 499 ...

function generateAstrologers(count, existing = []) {
  const r = rng(20261009);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const used = new Set(existing.map((a) => a.slug));
  const out = [];
  let i = 0;
  while (out.length < count && i++ < count * 20) {
    const female = r() < 0.45;
    const name = `${pick(female ? FEMALE : MALE)} ${pick(LAST)}`;
    const slug = slugify(name);
    if (used.has(slug)) continue;
    used.add(slug);

    const experience = 3 + Math.floor(r() * 28);
    const specs = [pick(SPECS)];
    while (specs.length < 2 + Math.floor(r() * 2)) { const s = pick(SPECS); if (!specs.includes(s)) specs.push(s); }
    const languages = ['Hindi'];
    while (languages.length < 2 + Math.floor(r() * 3)) { const l = pick(OTHER_LANGS); if (!languages.includes(l)) languages.push(l); }

    const reviewCount = Math.round(60 + experience * (25 + r() * 35));
    const rating = Math.round((4.2 + r() * 0.7) * 10) / 10;
    const chat10 = price(79 + experience * 6 + r() * 60);
    const chat30 = price(chat10 * (2.3 + r() * 0.3));
    const chat60 = price(chat30 * (1.5 + r() * 0.2));
    const call10 = price(chat10 * (1.4 + r() * 0.2));
    const call30 = price(chat30 * (1.3 + r() * 0.2));
    const call60 = price(chat60 * (1.25 + r() * 0.15));
    const roll = r();

    out.push({
      name, slug, gender: female ? 'FEMALE' : 'MALE', title: TITLES[specs[0]],
      profileImage: (r(), nextAvatar(female ? 'FEMALE' : 'MALE')), // r() kept so the random sequence (and therefore every slug) is unchanged
      coverImage: cover, gallery: [], isActive: true,
      bio: `${name} has ${experience} years of experience in Vedic astrology and ${BIO[specs[0]]}. Sessions are clear, respectful and focused on practical next steps. Consults in ${languages.join(', ')}.`,
      experience, specialization: specs, languages, rating, reviewCount,
      totalConsultations: Math.round(reviewCount * (4 + r() * 5)),
      onlineStatus: roll < 0.55 ? 'ONLINE' : roll < 0.75 ? 'BUSY' : 'OFFLINE',
      isVerified: r() < 0.9,
      chatPrice10Min: chat10, chatPrice30Min: Math.max(chat30, chat10 + 50), chatPrice60Min: Math.max(chat60, chat30 + 50),
      callPrice10Min: call10, callPrice30Min: Math.max(call30, call10 + 50), callPrice60Min: Math.max(call60, call30 + 50),
    });
  }
  return out;
}

// ---- Hand-written profiles + seeding ----
const baseCover = 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1400&q=70';

const base = [
  {
    name: 'Rahul Sharma', title: 'Love & Relationship Expert', gender: 'MALE',
    bio: 'Rahul Sharma has spent 15 years helping people through relationship doubts, breakups and delayed marriages. He combines Vedic birth-chart analysis with calm, practical advice you can act on. His sessions focus on timing, compatibility and what to do next.',
    experience: 15, specialization: ['Love', 'Relationship', 'Marriage'], languages: ['Hindi', 'English'],
    rating: 4.9, reviewCount: 1284, totalConsultations: 9650, onlineStatus: 'ONLINE', isVerified: true,
    chatPrice10Min: 199, chatPrice30Min: 499, chatPrice60Min: 799, callPrice10Min: 299, callPrice30Min: 699, callPrice60Min: 999,
  },
  {
    name: 'Priya Verma', title: 'Career & Finance Guide', gender: 'FEMALE',
    bio: 'Priya Verma reads dasha periods to help professionals choose when to switch jobs, ask for a promotion or invest. With 12 years of practice she is known for clear, structured readings and honest timelines.',
    experience: 12, specialization: ['Career', 'Finance', 'Business'], languages: ['Hindi', 'English', 'Punjabi'],
    rating: 4.8, reviewCount: 972, totalConsultations: 7420, onlineStatus: 'ONLINE', isVerified: true,
    chatPrice10Min: 249, chatPrice30Min: 599, chatPrice60Min: 999, callPrice10Min: 349, callPrice30Min: 799, callPrice60Min: 1299,
  },
  {
    name: 'Amit Joshi', title: 'Marriage & Family Counsellor', gender: 'MALE',
    bio: 'Amit Joshi comes from a family of traditional jyotishis and has guided over six thousand families on marriage timing, kundli-based compatibility questions and household harmony across 22 years.',
    experience: 22, specialization: ['Marriage', 'Family', 'Relationship'], languages: ['Hindi', 'Gujarati', 'Marathi'],
    rating: 4.7, reviewCount: 1530, totalConsultations: 12110, onlineStatus: 'BUSY', isVerified: true,
    chatPrice10Min: 299, chatPrice30Min: 699, chatPrice60Min: 1199, callPrice10Min: 399, callPrice30Min: 899, callPrice60Min: 1499,
  },
  {
    name: 'Neha Sharma', title: 'Business & Finance Astrologer', gender: 'FEMALE',
    bio: 'Neha Sharma advises founders and shop owners on launch dates, partnerships and cash-flow cycles. Her 8 years of experience blend planetary transits with a practical business sense.',
    experience: 8, specialization: ['Business', 'Finance', 'Career'], languages: ['Hindi', 'English'],
    rating: 4.6, reviewCount: 518, totalConsultations: 3890, onlineStatus: 'ONLINE', isVerified: true,
    chatPrice10Min: 149, chatPrice30Min: 399, chatPrice60Min: 699, callPrice10Min: 249, callPrice30Min: 599, callPrice60Min: 899,
  },
  {
    name: 'Anjali Singh', title: 'Family & Life Guidance', gender: 'FEMALE',
    bio: 'Anjali Singh offers gentle, listening-first consultations on family conflicts, parenting worries and major life decisions. She has practised for 18 years and speaks four languages.',
    experience: 18, specialization: ['Family', 'Marriage', 'Love'], languages: ['Hindi', 'English', 'Bengali', 'Punjabi'],
    rating: 4.9, reviewCount: 1105, totalConsultations: 8870, onlineStatus: 'OFFLINE', isVerified: true,
    chatPrice10Min: 249, chatPrice30Min: 649, chatPrice60Min: 1099, callPrice10Min: 349, callPrice30Min: 849, callPrice60Min: 1399,
  },
  {
    name: 'Rohit Mehta', title: 'Career & Business Strategist', gender: 'MALE',
    bio: 'Rohit Mehta, 5 years into full-time practice, specialises in career-change timing for young professionals and first-time entrepreneurs. Affordable sessions with a straight-talking style.',
    experience: 5, specialization: ['Career', 'Business', 'Love'], languages: ['Hindi', 'English', 'Marathi'],
    rating: 4.5, reviewCount: 241, totalConsultations: 1760, onlineStatus: 'ONLINE', isVerified: false,
    chatPrice10Min: 99, chatPrice30Min: 299, chatPrice60Min: 499, callPrice10Min: 149, callPrice30Min: 399, callPrice60Min: 699,
  },
].map((a) => ({ ...a, slug: slugify(a.name), coverImage: baseCover, profileImage: nextAvatar(a.gender), gallery: [], isActive: true }));

// 6 hand-written profiles + 104 generated demo profiles = 110 astrologers
const data = [...base, ...generateAstrologers(104, base)];

await connectDB();
const result = await Astrologer.bulkWrite(
  data.map((a) => ({ updateOne: { filter: { slug: a.slug }, update: { $set: a }, upsert: true } }))
);
console.log(`Seeded astrologers: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);
await mongoose.connection.close();