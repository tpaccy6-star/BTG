import bcrypt from 'bcryptjs';
import sequelize from './database.js';
import { User, Lesson, Message, Submission, Announcement, Cohort } from './models.js';

const seedDatabase = async () => {
  try {
    // Sync Database (forces recreate tables)
    await sequelize.sync({ force: true });
    console.log('Database synced successfully.');

    // --- Seed Cohorts ---
    const cohorts = await Cohort.bulkCreate([
      { id: 1, name: 'Cohort 1', scholars: 150, progress: 45, status: 'Needs Attention', attendance: 78, university: 'INES-Ruhengeri' },
      { id: 2, name: 'Cohort 2', scholars: 130, progress: 80, status: 'Excelling', attendance: 95, university: 'UR Huye Campus' },
      { id: 3, name: 'Cohort 3', scholars: 120, progress: 20, status: 'Just Started', attendance: 88, university: 'UTB Gisenyi' },
      { id: 4, name: 'Cohort 4', scholars: 120, progress: 75, status: 'Excelling', attendance: 92, university: 'University of Rwanda' }
    ]);
    console.log('Default cohorts seeded.');

    // --- Seed Users ---
    const passwordHash = bcrypt.hashSync('password123', 10);

    const users = await User.bulkCreate([
      {
        email: 'scholar@generationrise.org',
        passwordHash,
        role: 'scholar',
        name: 'Alex Johnson',
        initials: 'AJ',
        university: 'University of Rwanda',
        yearLevel: 'Year 2 Scholar',
        streakDays: 14,
        cohortId: 4
      },
      {
        email: 'mentor@generationrise.org',
        passwordHash,
        role: 'mentor',
        name: 'Sarah Miller',
        initials: 'SM',
        university: 'Kigali Mentors Group',
        yearLevel: 'Lead Mentor',
        streakDays: 0
      },
      {
        email: 'teacher@generationrise.org',
        passwordHash,
        role: 'teacher',
        name: 'Prof. Robert',
        initials: 'RM',
        university: 'Global Academy',
        yearLevel: 'Global Head',
        streakDays: 0
      },
      {
        email: 'admin@generationrise.org',
        passwordHash,
        role: 'admin',
        name: 'Admin User',
        initials: 'AD',
        university: 'Operations Unit',
        yearLevel: 'System Admin',
        streakDays: 0
      }
    ]);
    console.log('Default users seeded.');

    // --- Seed Lessons ---
    const lessons = await Lesson.bulkCreate([
      // Career Readiness
      {
        id: 'career-1',
        title: 'Resume Writing Basics',
        pillar: 'career',
        description: 'Learn how to format, structure, and write a professional CV targeting entry-level internships.',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        resources: JSON.stringify([
          { name: 'CV Template Starter Guide', size: '1.2 MB', link: '#' },
          { name: 'Action Verbs Cheat Sheet', size: '340 KB', link: '#' }
        ]),
        duration: 45,
        cohortId: 4
      },
      {
        id: 'career-2',
        title: 'Interview Techniques & Practice',
        pillar: 'career',
        description: 'Master the STAR method for behavioral interview responses and standard interview etiquettes.',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        resources: JSON.stringify([
          { name: 'Behavioral Questions Handbook', size: '2.5 MB', link: '#' }
        ]),
        duration: 60,
        cohortId: 4
      },
      {
        id: 'career-3',
        title: 'Professional Networking 101',
        pillar: 'career',
        description: 'How to network on LinkedIn and connect with professional leaders in your industry.',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        resources: JSON.stringify([
          { name: 'Elevator Pitch Worksheet', size: '540 KB', link: '#' }
        ]),
        duration: 30,
        cohortId: null // Global
      },
      // Entrepreneurship
      {
        id: 'entrepreneur-1',
        title: 'Ideation & Customer Profile Segmenting',
        pillar: 'entrepreneur',
        description: 'Familiarize yourself with defining customer personas and mapping user pain points.',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        resources: JSON.stringify([
          { name: 'Customer Persona Template', size: '890 KB', link: '#' }
        ]),
        duration: 50,
        cohortId: 4
      },
      {
        id: 'entrepreneur-2',
        title: 'Crafting Your Value Proposition Canvas',
        pillar: 'entrepreneur',
        description: 'Build a solid value proposition template correlating user pains to product features.',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        resources: JSON.stringify([
          { name: 'Value Prop Canvas Workbook', size: '1.5 MB', link: '#' }
        ]),
        duration: 60,
        cohortId: 4
      },
      {
        id: 'entrepreneur-3',
        title: 'Business Model Canvas Deep Dive',
        pillar: 'entrepreneur',
        description: 'Detailed analysis of the 9 building blocks of the Business Model Canvas (BMC).',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        resources: JSON.stringify([
          { name: 'BMC Master Template', size: '3.1 MB', link: '#' }
        ]),
        duration: 75,
        cohortId: null // Global
      },
      // English
      {
        id: 'english-1',
        title: 'Email Etiquette & Communication Styles',
        pillar: 'english',
        description: 'Guidelines on writing clear, professional, and grammatically correct emails.',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        resources: JSON.stringify([
          { name: 'Formal Email Templates', size: '1.0 MB', link: '#' }
        ]),
        duration: 30,
        cohortId: 4
      },
      {
        id: 'english-2',
        title: 'Report Writing & Document Formatting',
        pillar: 'english',
        description: 'How to structure whitepapers, summaries, and executive reports formatted professionally.',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        resources: JSON.stringify([
          { name: 'Report Writing Outline', size: '750 KB', link: '#' }
        ]),
        duration: 45,
        cohortId: 3 // Only Cohort 3 (UTB Gisenyi)
      },
      // Life Skills
      {
        id: 'life-1',
        title: 'Goal Setting & Personal Vision Planning',
        pillar: 'life',
        description: 'Use the SMART goals framework to draft short-term and long-term professional plans.',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        resources: JSON.stringify([
          { name: 'Personal Goals Worksheet', size: '920 KB', link: '#' }
        ]),
        duration: 40,
        cohortId: 4
      },
      {
        id: 'life-2',
        title: 'Time Management & Focus Frameworks',
        pillar: 'life',
        description: 'Strategies for productivity using time blocking, Pomodoro, and prioritization matrices.',
        videoUrl: 'https://www.w3schools.com/html/movie.mp4',
        resources: JSON.stringify([
          { name: 'Weekly Schedule Timeboxer', size: '600 KB', link: '#' }
        ]),
        duration: 40,
        cohortId: 1 // Only Cohort 1 (INES-Musanze)
      }
    ]);
    console.log('Curriculum lessons seeded.');

    // --- Seed Messages ---
    const scholar = users.find(u => u.role === 'scholar');
    const mentor = users.find(u => u.role === 'mentor');

    await Message.bulkCreate([
      {
        senderId: mentor.id,
        senderName: mentor.name,
        recipientId: scholar.id,
        content: 'Hi Alex! Welcome to the Scholar Portal. Let me know if you need help with the Value Proposition worksheet.',
        timestamp: new Date(Date.now() - 3600000 * 2) // 2h ago
      },
      {
        senderId: scholar.id,
        senderName: scholar.name,
        recipientId: mentor.id,
        content: 'Hi Sarah, thanks! I am actually working on it right now. I have a question about the pain relievers section.',
        timestamp: new Date(Date.now() - 3600000) // 1h ago
      },
      {
        senderId: mentor.id,
        senderName: mentor.name,
        recipientId: scholar.id,
        content: 'Of course! Pain relievers should outline how your product specifically eliminates or reduces the user pain points we mapped in customer profile.',
        timestamp: new Date(Date.now() - 1800000) // 30m ago
      }
    ]);
    console.log('Mock chat history seeded.');

    // --- Seed Submissions ---
    await Submission.bulkCreate([
      {
        scholarId: scholar.id,
        lessonId: 'career-1',
        status: 'completed',
        submittedAt: new Date(Date.now() - 3600000 * 24 * 3) // 3 days ago
      },
      {
        scholarId: scholar.id,
        lessonId: 'english-1',
        status: 'graded',
        score: 95,
        feedback: 'Excellent formal email structure and appropriate tone throughout!',
        submittedAt: new Date(Date.now() - 3600000 * 24 * 5) // 5 days ago
      }
    ]);
    console.log('Default submissions seeded.');

    // --- Seed Announcements ---
    await Announcement.bulkCreate([
      {
        title: 'Welcome to Generation Rise Platform!',
        content: 'We are thrilled to welcome our new cohort of scholars. Ensure you complete your profile setup and review the learning catalog to begin your leadership journey.',
        author: 'Prof. Robert',
        date: '2026-06-01'
      },
      {
        title: 'Attendance Registry Sync Notice',
        content: 'All scholars are required to scan classroom QR codes or check-in daily. Failure to self-register will impact your compliance rating.',
        author: 'Sarah Miller',
        date: '2026-06-04'
      }
    ]);
    console.log('Default announcements seeded.');

    console.log('Seeding completed successfully.');

  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

// If run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}

export default seedDatabase;
