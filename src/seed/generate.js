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
const price = (n) => Math.max(49, Math.round(n / 10) * 10 - 1); // 199, 249, 499 ...

export function generateAstrologers(count, existing = []) {
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
      profileImage: `https://randomuser.me/api/portraits/${female ? 'women' : 'men'}/${1 + Math.floor(r() * 98)}.jpg`,
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
