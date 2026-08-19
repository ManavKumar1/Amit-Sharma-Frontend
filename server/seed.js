/**
 * Run with: npm run seed
 * Creates the one owner account (from .env, or sensible defaults below)
 * plus starter Profile / Services / Portfolio / Testimonials / Availability
 * so the dashboard and public site aren't empty on first run.
 * Safe to re-run — it upserts rather than duplicating.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

const User = require('./models/User');
const Profile = require('./models/Profile');
const Service = require('./models/Service');
const Portfolio = require('./models/Portfolio');
const Testimonial = require('./models/Testimonial');
const Availability = require('./models/Availability');

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL || 'owner@example.com';
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD || 'changeme123';

async function seed() {
  await connectDB();

  // Owner account
  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 10);
  await User.findOneAndUpdate(
    { email: OWNER_EMAIL },
    { name: 'Amit Sharma', email: OWNER_EMAIL, passwordHash },
    { upsert: true }
  );
  console.log(`Owner account ready: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log('Change this password after your first login (or before deploying).');

  // Profile
  await Profile.findOneAndUpdate(
    {},
    {
      name: 'Amit Sharma',
      title: 'Makeup Artist & Hairstylist',
      tagline: "Beauty and hair for weddings, editorial shoots, and nights you'll want to remember.",
      bio: 'Amit trained at the Cinema Makeup School in Los Angeles before spending six years on bridal and editorial teams across the Bay Area.',
      phone: '+91-9829559515',
      whatsapp: '9829559515',
      email: 'Amit@gmail.com',
      address: 'India',
      city: 'Delhi',
      mapsUrl: 'https://maps.app.goo.gl/Ftx7VvTW77NdU3Tj8',
      instagramUrl: 'https://www.instagram.com/amitsharma.mua',
      facebookUrl: '',
      businessHours: [
        { day: 'Monday', open: '10:00 AM', close: '7:00 PM', closed: false },
        { day: 'Tuesday', open: '10:00 AM', close: '7:00 PM', closed: false },
        { day: 'Wednesday', open: '10:00 AM', close: '7:00 PM', closed: false },
        { day: 'Thursday', open: '10:00 AM', close: '7:00 PM', closed: false },
        { day: 'Friday', open: '10:00 AM', close: '7:00 PM', closed: false },
        { day: 'Saturday', open: '10:00 AM', close: '7:00 PM', closed: false },
        { day: 'Sunday', open: '', close: '', closed: true },
      ],
    },
    { upsert: true }
  );

  // Services — upsert by name so re-running seed repairs anything missing
  // without duplicating what's already there.
  const services = [
    { name: 'Bridal Makeup', description: 'Full bridal beat with trial run included, false lashes, and touch-up kit.', price: 285, duration: 120, category: 'Bridal', sortOrder: 1 },
    { name: 'Party Makeup', description: 'Event-ready makeup for weddings, galas, and nights out.', price: 135, duration: 60, category: 'Makeup', sortOrder: 2 },
    { name: 'Engagement Makeup', description: 'Soft, camera-ready look for engagement and pre-wedding shoots.', price: 165, duration: 75, category: 'Makeup', sortOrder: 3 },
    { name: 'Hair Styling', description: 'Blowout, updo, or editorial styling — built to last through the event.', price: 110, duration: 60, category: 'Hair', sortOrder: 4 },
    { name: 'Precision Haircut', description: 'Consultation and cut tailored to face shape and hair texture.', price: 95, duration: 45, category: 'Haircut', sortOrder: 5 },
    { name: "Groom's Grooming", description: 'Skin prep, light contour, and hair styling for the groom or groomsmen.', price: 85, duration: 40, category: 'Grooming', sortOrder: 6 },
  ];
  for (const item of services) {
    await Service.findOneAndUpdate({ name: item.name }, item, { upsert: true, setDefaultsOnInsert: true });
  }
  console.log(`Services seeded/verified: ${services.length}.`);

  // Portfolio (placeholder images — replace via the dashboard's image upload)
  const portfolio = [
    { imageUrl: 'https://instagram.fblr22-1.fna.fbcdn.net/v/t51.82787-15/655965709_18124365820573351_3581777825391682670_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_cat=106&ig_cache_key=MzU1NDA1MDc1NjU1NDQwNTk2OA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=R1fuqvwRJSUQ7kNvwGMNDa7&_nc_oc=AdoltPZlJcwWL2TmDHuc8TdVO4jgv09E5QoRHSRUX-XPYBAFKXx8YGli21OmidCASxk&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr22-1.fna&_nc_gid=kJrBGdXtImC7Nj-O_hEP2Q&_nc_ss=7a22e&oh=00_AQE7tvbWFkpUQazsFlNHapLzqFWoUsDSoZiciUvuYvkG1w&oe=6A88CA0D', title: 'Garden Ceremony Bridal', category: 'bridal', caption: 'Soft glam for an outdoor June wedding.', isFeatured: true },
    { imageUrl: 'https://instagram.fblr2-2.fna.fbcdn.net/v/t51.82787-15/642219787_18561620032006139_8861930135960924125_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_cat=109&ig_cache_key=MzUyMjE2Mzc4MTAyNTY5MzYyNw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=c0wLV5sVxR0Q7kNvwFk_jE2&_nc_oc=AdoZlL8ga3Xa05yLhE5toCcd9M0HRbzMplKOfqTQnaqQywYOd3QaJvsukXWiWeTPhRpq99Wyi3ArpJZEcnEa9vJs&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr2-2.fna&_nc_gid=LapISS6yD25OlL6Nvvf4dQ&_nc_ss=7a22e&oh=00_AQGjUiR_ud_GYmKc3K5WY2sOKv99_u-RPLQCLxi1-H8tKA&oe=6A88AA73', title: 'Blunt Bob', category: 'haircut', caption: 'Precision cut with a soft interior layer.' },
    { imageUrl: 'https://instagram.fblr2-2.fna.fbcdn.net/v/t51.75761-15/474743604_17863345770321484_145648599527117743_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_cat=110&ig_cache_key=MzU1MTExNDM3OTQ2NDk4MTM3Nw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=-_Uw3mqZR5wQ7kNvwFYQDlJ&_nc_oc=Ado0nkljtSqnPqsVclblDsT411-lknFGDsZFkCXkSWpmFI4_jmkPhdYkAdbRrGk494ggysbafi6-JB-9nT61jLfz&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr2-2.fna&_nc_gid=hCA7yzsRNkRqrxyoR7T77w&_nc_ss=7a22e&oh=00_AQFqH_-slNGTDwkXIHKc6PuMGzm_UQxpcZh44XN7ozwLKQ&oe=6A88A87D', title: 'Editorial Skin', category: 'editorial', caption: 'Dewy base for a beauty editorial.' },
    { imageUrl: 'https://instagram.fblr2-3.fna.fbcdn.net/v/t51.75761-15/471603898_17859608919321484_5706792475491200018_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_cat=103&ig_cache_key=MzUzMTU0MTU4NzMzNzg4NTEwNQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=bvzVxKIIUUsQ7kNvwFRAYTP&_nc_oc=AdreFqM_BzbPCpMJ9yFPTqnOLkQfelkZUtU_z1OKKgEpPewVjETvlEB3UE4rAbZm6G8Ty_0yUW8NHa4UNaGqbZXL&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr2-3.fna&_nc_gid=grME1Y6Q7Jgy6m34ObiwEw&_nc_ss=7a22e&oh=00_AQFNTEDUB-kfLpriMexiqV5boI8-as9GPzKahPvPLWUFdg&oe=6A88D706', title: 'Undone Updo', category: 'hair', caption: 'Textured low bun with face-framing pieces.' },
    { imageUrl: 'https://instagram.fblr2-3.fna.fbcdn.net/v/t51.82787-15/655035227_18093119132039929_3402810747047777231_n.webp?_nc_cat=101&ig_cache_key=MzMzNDQ4MzMyNjkzMjgyNjUzNw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=XSzkYIyD-sAQ7kNvwFarwu5&_nc_oc=AdoL_DWNerKacP0PBu0Rql2Zfs6_hCQbDpPlNK7LKYyFulUj-VhAOG9UsoUQ93KrJg3wyaLVEzfsrxqIquLAIazS&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr2-3.fna&_nc_gid=tvDZomir80DOJgzEo43igw&_nc_ss=7a22e&oh=00_AQFKGCvNMvIfKAOR_iCW-oNRVTnxAMAImkJ_HstA_qxvvw&oe=6A88C10B', title: 'Bronze Evening', category: 'makeup', caption: 'Warm smoked eye for an evening gala.', isFeatured: true },
    { imageUrl: 'https://instagram.fblr2-2.fna.fbcdn.net/v/t51.82787-15/656444150_18112275064685641_5113747423570697462_n.webp?_nc_cat=100&ig_cache_key=MzMzMzc1MDMyMTkwMTQ5NDQxOQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=5TkCd8F9uv0Q7kNvwHVxfMI&_nc_oc=AdpqXjaI32W4M_UxjC5trqcg6Wwiytb5Sncz_qQKMak4uVXrvljT8DwKCVFumQlTfwMrdqdrn-C3WcUq9XXhZrbK&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr2-2.fna&_nc_gid=0xL1YdOjc50oNd9x13yb1w&_nc_ss=7a22e&oh=00_AQGfYJMy4I1aKWAv6y9_8zzuuj2qzRblyBofKzI_i1WmAQ&oe=6A88B4D2', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.' },
    { imageUrl: 'https://instagram.fblr2-3.fna.fbcdn.net/v/t51.82787-15/656858370_18086847848352065_4768169296942279975_n.webp?_nc_cat=105&ig_cache_key=MzI5ODI3NzUzMzE2NjIyNzkyNQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=T3hxNi67RPsQ7kNvwG6d9Ti&_nc_oc=Adrdij6Nb7BAEob9c4EG0J1j4S0270b6UOYGAZsRkvyrxSdrDwIog5mT5uboiXi2-eMA9Ts4OmCIyzIH7AaWEn2G&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr2-3.fna&_nc_gid=7KIC4EOeWIDcH96j5vFmVg&_nc_ss=7a22e&oh=00_AQGl8CqorPIH3QTI_kft6lfvQf4pseAWZ1l3SHmH0bP8OA&oe=6A88BB06', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.' },
    { imageUrl: 'https://instagram.fblr2-2.fna.fbcdn.net/v/t51.82787-15/643000815_17980236971977196_6506814951489788564_n.webp?_nc_cat=108&ig_cache_key=MzI5ODI3NzUzMzE3NDY2ODEwNg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=9Q92wXvkYUQQ7kNvwHk3XTT&_nc_oc=AdoszNI1NZ81CQ_4dKWdUSAETY2-7uXooZUDD8W899CecIJEgyc8EejvH0fiCiLy50t5YCfdsjtlnKDsj3dMz1Q_&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr2-2.fna&_nc_gid=7KIC4EOeWIDcH96j5vFmVg&_nc_ss=7a22e&oh=00_AQFeLK_NeBpVh-UYRqI6VX6mUmnyAWDwXTGQjmP2h_fhhg&oe=6A88BE17', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.' },
    { imageUrl: 'https://instagram.fblr2-3.fna.fbcdn.net/v/t51.82787-15/589116595_18542365042037092_8546761986296874262_n.heic?stp=dst-jpg_e35_p1080x1080_tt6&_nc_cat=102&ig_cache_key=Mzc4MDIxNjQyMTUxNTg1MjcwNw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=5xME5wZbTNcQ7kNvwFaGmSe&_nc_oc=AdrAipqyyRR6lT7fvmcoNsEn0hd2YtGYgoWWE7Wjup_TA2RLN7cepHh6_mFKhfMKhMtT0XQY4z7wrlIx_AgfHENo&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr2-3.fna&_nc_gid=dq6izJyJ0HMnznuWgUad1A&_nc_ss=7a22e&oh=00_AQGKtCXeZCEaWL8yCdRtvE19fne-lUs94XFRkByvmndgyg&oe=6A88C6E7', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.' },
    { imageUrl: 'https://instagram.fblr2-2.fna.fbcdn.net/v/t51.82787-15/575631690_18537316888037092_7038967682586234591_n.heic?stp=dst-jpg_e35_p1080x1080_tt6&_nc_cat=110&ig_cache_key=Mzc2MDU5MTAyMDk4ODk5MDQ5Mg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=0PzdKW9_OkwQ7kNvwGa-dLE&_nc_oc=AdqLb2yCAWxWjSRimUid8_t5jjNjHUVUM2kXS_H8kmUS2MsaMyShkxe0-PMGaivPP9Lpwrh33PeaU5pQpZo7AONl&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr2-2.fna&_nc_gid=dq6izJyJ0HMnznuWgUad1A&_nc_ss=7a22e&oh=00_AQFsig9FhNpSDDNM-Ck88m0bVXA_x2a5Mt6aYiV4iRpGhg&oe=6A88C757', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.' },
    { imageUrl: 'https://instagram.fblr2-2.fna.fbcdn.net/v/t51.82787-15/573576421_18534920830037092_2838500901636452854_n.heic?stp=dst-jpg_e35_p1080x1080_tt6&_nc_cat=100&ig_cache_key=Mzc1MjY1NjcwMzU3NDkxMTI2MQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=mRfHTIuwBXkQ7kNvwFZkPtF&_nc_oc=AdoDexfmBxyNqY5JqPl9gjb7t4t7VBFhxfbA7eCY5YMwciB1L265BEl8KuugcUqBMvNFzdfY2pWOPKESueyhdnWj&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr2-2.fna&_nc_gid=Ym2ETZHRvr__BOKSdpqi9w&_nc_ss=7a22e&oh=00_AQFusaBAL8XyjgyNJpUo05tGURasQGwjrsWB_apS2GiBog&oe=6A88DBDC', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.' },
    { imageUrl: 'https://instagram.fblr2-3.fna.fbcdn.net/v/t51.82787-15/625328356_18082794080241373_4687808186819183915_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_cat=104&ig_cache_key=MzYzMDg2MTg4Mjg4MzYwOTA5Mw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=3ScJTpuAFpoQ7kNvwGJyX52&_nc_oc=AdpjUuMpypNjDx7JU5y6ot4R5Oac9XUz6PmNoy37-InPshn0QFB1NNa4ZMgN6DcRggugdxNtmm_WMrr7K-QOQOvw&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr2-3.fna&_nc_gid=mCvshG0wEEqXhXxhmjbY4w&_nc_ss=7a22e&oh=00_AQGWkkUNJRS0nSSTbuiSRnFadwrWSmz4iQVfv44BsFV1sA&oe=6A88D4D5', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.' },
    { imageUrl: 'https://instagram.fblr2-3.fna.fbcdn.net/v/t51.82787-15/652887421_17931318762057654_3166375531451447875_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_cat=102&ig_cache_key=MzYxOTI5MDExMzk2MjAzNzY0Mw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=WNg3VtDbkewQ7kNvwFTGZPL&_nc_oc=AdplHdxY6AQrfF_UEvDhVBwN-_vSdak9nAG7OgQduKG0y47psaDjCrmKfoNnOh8LgIocan1nXB2DKF-jhvl9nGf1&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr2-3.fna&_nc_gid=fnumLg6Vp5jCBl0yB1GTTA&_nc_ss=7a22e&oh=00_AQHYrrLPDqZoBE-4jz1BzsrpSXkt-XrbBmJ0uc8kT27pqA&oe=6A88B068', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.' },
    { imageUrl: 'https://instagram.fblr2-3.fna.fbcdn.net/v/t51.82787-15/650398272_17962047780026401_5496141362182875278_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=MzQ1MTA5OTIzNzgxODY0Mzg1Mg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTA4MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=cI6NBPI_ZQQQ7kNvwHSZdhv&_nc_oc=Adr4mxv_IbTBPdHyF82InQ0NTHfnsBIsEiEXjVXPiCJuIS6B97Rf6OpY1-vXpiYvMSFDK3BY7JkuajQu6x_w7mUF&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr2-3.fna&_nc_gid=FtskCB6f-E1BBXpyc1Q7dg&_nc_ss=7a22e&oh=00_AQGbYX5J58GY45LY8uBAVZoXOKos1iOoC89OlUVN3_hV4g&oe=6A88D0B2', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.' },
    { imageUrl: 'https://instagram.fblr2-2.fna.fbcdn.net/v/t39.30808-6/469328359_18470969611037092_2543720928244156519_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_cat=100&ig_cache_key=MzE3MjExNTY5Nzg5NTczNjM3NQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTM0OS5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=7U3BVtVNMlwQ7kNvwHGVo1f&_nc_oc=Adohf8QNH8B-x5fUjYrK9dy3KMg-jzFpfg8VhrRk46mHs4V6_-vRLPKabbsGcIiez5wOxtbjtOIoqHsITrVoru5j&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fblr2-2.fna&_nc_gid=kY8pvULoqY-fU32aGouRvA&_nc_ss=7a22e&oh=00_AQHZVa5SvGESm5pSD4xTxcxMs64dPH3lc5ssw-SYXPoe3w&oe=6A88AB48', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.' },
    { imageUrl: 'https://picsum.photos/seed/port-bridal2/900/700', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.' },
  ];
  
  for (const item of portfolio) {
    await Portfolio.findOneAndUpdate({ title: item.title }, item, { upsert: true, setDefaultsOnInsert: true });
  }
  console.log(`Portfolio seeded/verified: ${portfolio.length}.`);

  // Testimonials — upsert by clientName + service so re-running is safe.
const testimonials = [
  {
    clientName: 'Priya S.',
    rating: 5,
    service: 'Bridal Makeup',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    review:
      "I was honestly nervous about looking too 'made up' on my wedding day, but she understood exactly what I wanted. My skin looked like skin, just better, and everything stayed perfect right through the reception."
  },
  {
    clientName: 'Elena R.',
    rating: 5,
    service: 'Editorial Shoot',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    review:
      "She understood the mood of the shoot immediately and somehow made every look feel effortless. The makeup photographed beautifully, and she was so easy to work with on set."
  },
  {
    clientName: 'Jordan T.',
    rating: 5,
    service: 'Hair Styling',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
    review:
      "I showed her a few reference photos and she completely got the look I was going for. My hair had so much movement and still looked amazing when I woke up the next morning."
  },
  {
    clientName: 'Ananya M.',
    rating: 5,
    service: 'Bridal Makeup',
    imageUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop&crop=face',
    review:
      "From the trial to the wedding day, everything felt so organised and relaxed. I got so many compliments on my makeup, especially how natural my eyes looked."
  },
  {
    clientName: 'Sofia K.',
    rating: 5,
    service: 'Party Makeup',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    review:
      "I don't usually wear much makeup, so I was worried it would feel heavy. It didn't at all. She listened to what I was comfortable with and the final look was exactly right for me."
  },
  {
    clientName: 'Meera P.',
    rating: 5,
    service: 'Hair & Makeup',
    imageUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&fit=crop&crop=face',
    review:
      "Everything was so thoughtfully done, from the hair to the smallest makeup details. I felt beautiful without feeling like I was wearing someone else's look. Would absolutely book her again."
  }
];
  for (const item of testimonials) {
    await Testimonial.findOneAndUpdate(
      { clientName: item.clientName, service: item.service },
      item,
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Testimonials seeded/verified: ${testimonials.length}.`);

  // Availability — upsert by dayOfWeek (same pattern the dashboard's Save Hours uses).
  const availabilityDefaults = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    startTime: '10:00',
    endTime: '19:00',
    isAvailable: dayOfWeek !== 0,
  }));
  for (const day of availabilityDefaults) {
    await Availability.findOneAndUpdate({ dayOfWeek: day.dayOfWeek }, day, { upsert: true, setDefaultsOnInsert: true });
  }
  console.log('Weekly availability seeded/verified.');

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});