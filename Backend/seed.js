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
        videoUrl: 'https://www.youtube.com/embed/Tt08KmFfIYQ',
        resources: JSON.stringify([
          { name: 'CV Template Starter Guide', size: '1.2 MB', link: '#' },
          { name: 'Action Verbs Cheat Sheet', size: '340 KB', link: '#' }
        ]),
        notes: JSON.stringify([
  {
    "id": "blk_5irkzyz4j",
    "type": "paragraph",
    "content": "RESUME WRITING BASICS"
  },
  {
    "id": "blk_bo36xnvdf",
    "type": "paragraph",
    "content": "Your resume is often the first impression you make on a potential employer. Make it count by keeping it concise, relevant, and easy to read."
  },
  {
    "id": "blk_exgcfpp5r",
    "type": "accordion",
    "title": "Learning Objectives",
    "content": "Understand the purpose and structure of a professional resume.\nLearn to use action verbs to describe accomplishments.\nIdentify common resume mistakes and how to avoid them."
  },
  {
    "id": "blk_tt0ng0cz3",
    "type": "paragraph",
    "content": "KEY TERMINOLOGY"
  },
  {
    "id": "blk_xiqc6k6g0",
    "type": "flipcard",
    "front": "Action Verbs",
    "back": "Strong verbs used at the beginning of bullet points (e.g., Achieved, Managed, Designed)."
  },
  {
    "id": "blk_h6oezu5sp",
    "type": "flipcard",
    "front": "Applicant Tracking System (ATS)",
    "back": "Software used by employers to filter resumes based on keywords."
  },
  {
    "id": "blk_mz3xg9out",
    "type": "paragraph",
    "content": "RESUME SECTIONS BREAKDOWN"
  },
  {
    "id": "blk_xl6pcffho",
    "type": "paragraph",
    "content": "|The header includes your name, phone number, email, and LinkedIn profile link.|List your university, degree, expected graduation date, and relevant coursework.|Detail your past internships, jobs, and leadership roles using bullet points starting with action verbs.|Include both hard skills (software, languages) and soft skills (leadership, teamwork)."
  },
  {
    "id": "blk_slot14bmj",
    "type": "accordion",
    "title": "Summary & Next Steps",
    "content": "Review your current resume and try applying the STAR method (Situation, Task, Action, Result) to your experience bullet points. Download the template in the resources section!"
  }
]),
        quizData: JSON.stringify([
          {
            type: 'multiple-choice',
            question: 'What is the best way to start a bullet point in the Experience section?',
            options: ['"I was responsible for..."', 'With a strong Action Verb (e.g., "Led", "Developed")', '"My duties included..."', 'With a noun describing the job'],
            correctAnswerIndex: 1,
            explanation: 'Action verbs make your accomplishments sound impactful and direct, avoiding passive phrasing.'
          },
          {
            type: 'true-false',
            question: 'You should always include a photo of yourself on a standard professional resume in North America.',
            options: ['True', 'False'],
            correctAnswerIndex: 1,
            explanation: 'In many regions (like North America), photos are discouraged due to anti-discrimination laws. Check local norms!'
          }
        ]),
        duration: 45,
        cohortId: null
      },
      {
        id: 'career-2',
        title: 'Interview Techniques & Practice',
        pillar: 'career',
        description: 'Master the STAR method for behavioral interview responses and standard interview etiquettes.',
        videoUrl: 'https://www.youtube.com/embed/HG68Ymazo18',
        resources: JSON.stringify([
          { name: 'Behavioral Questions Handbook', size: '2.5 MB', link: '#' }
        ]),
        notes: JSON.stringify([
  {
    "id": "blk_m2nmx07bq",
    "type": "paragraph",
    "content": "MASTERING THE INTERVIEW"
  },
  {
    "id": "blk_2h3mhufxn",
    "type": "accordion",
    "title": "Learning Objectives",
    "content": "Master the STAR method for answering behavioral questions.\nUnderstand pre-interview preparation strategies.\nLearn post-interview follow-up etiquette."
  },
  {
    "id": "blk_ovg0qu4a3",
    "type": "paragraph",
    "content": "THE STAR METHOD"
  },
  {
    "id": "blk_337qpglxp",
    "type": "paragraph",
    "content": "Behavioral interviews ask you to provide specific examples of past behavior. Use the STAR method to structure your answers:"
  },
  {
    "id": "blk_h3shhpnj1",
    "type": "paragraph",
    "content": "|Describe the context or background of your story. Set the scene.|Explain the specific challenge or task you needed to accomplish.|Detail the exact steps YOU took to address the task. Focus on your contribution.|Share the outcomes of your actions. Use data or metrics if possible."
  },
  {
    "id": "blk_cpnyfapkt",
    "type": "paragraph",
    "content": "QUICK PRACTICE FLASHCARDS"
  },
  {
    "id": "blk_pnk2b1r2g",
    "type": "flipcard",
    "front": "Behavioral Question",
    "back": "Questions starting with 'Tell me about a time when...' or 'Give me an example of...'"
  },
  {
    "id": "blk_xgiivhi8w",
    "type": "flipcard",
    "front": "Post-Interview",
    "back": "Always send a concise 'Thank You' email within 24 hours to your interviewers."
  }
]),
        quizData: JSON.stringify([
          {
            type: 'multiple-choice',
            question: 'What does the R stand for in the STAR method?',
            options: ['Reason', 'Reaction', 'Result', 'Resolution'],
            correctAnswerIndex: 2,
            explanation: 'Result. You should always conclude your story by sharing the positive outcome or what you learned.'
          }
        ]),
        duration: 60,
        cohortId: null
      },
      // Entrepreneurship
      {
        id: 'entrepreneur-1',
        title: 'Ideation & Customer Profile Segmenting',
        pillar: 'entrepreneur',
        description: 'Familiarize yourself with defining customer personas and mapping user pain points.',
        videoUrl: 'https://www.youtube.com/embed/tB1nQ2xLgPQ',
        resources: JSON.stringify([
          { name: 'Customer Persona Template', size: '890 KB', link: '#' }
        ]),
        notes: JSON.stringify([
  {
    "id": "blk_5h8isyp1n",
    "type": "paragraph",
    "content": "IDEATION & CUSTOMER PERSONAS"
  },
  {
    "id": "blk_ssuoloyt6",
    "type": "paragraph",
    "content": "Welcome to the lesson! Here are some interactive tools to help you learn how to identify your ideal customer."
  },
  {
    "id": "blk_wu1vn3sjx",
    "type": "accordion",
    "title": "Learning Objectives",
    "content": "Define what a Customer Persona is and why it matters.\nLearn to identify customer Pain Points.\nUnderstand the 5 Whys framework for root-cause analysis."
  },
  {
    "id": "blk_4i35qdmrq",
    "type": "paragraph",
    "content": "KEY VOCABULARY"
  },
  {
    "id": "blk_5o9srl6tf",
    "type": "flipcard",
    "front": "Customer Persona",
    "back": "A semi-fictional representation of your ideal customer based on market research and real data."
  },
  {
    "id": "blk_c5kohl7s2",
    "type": "flipcard",
    "front": "Pain Point",
    "back": "A specific problem that prospective customers of your business are experiencing."
  },
  {
    "id": "blk_rwx8vax34",
    "type": "paragraph",
    "content": "FRAMEWORKS"
  },
  {
    "id": "blk_w9zwez8iw",
    "type": "accordion",
    "title": "The 5 Whys Framework",
    "content": "The 5 Whys is an iterative interrogative technique used to explore the cause-and-effect relationships underlying a particular problem. By repeating the question \"Why?\", you can peel away the layers of symptoms which can lead to the root cause of a problem."
  },
  {
    "id": "blk_0wghh272s",
    "type": "paragraph",
    "content": "SEGMENTING STRATEGIES"
  },
  {
    "id": "blk_c1beqfja3",
    "type": "paragraph",
    "content": "|Age, gender, income, education, and occupation.|Lifestyle, values, personality, and opinions.|Purchasing behavior, brand interactions, and loyalty."
  }
]),
        quizData: JSON.stringify([
          {
            type: 'multiple-choice',
            question: 'What is a Customer Persona?',
            options: [
              'A totally made-up character with no basis in reality',
              'A semi-fictional representation of your ideal customer based on data',
              'The actual name of your first paying customer',
              'A list of products you want to sell'
            ],
            correctAnswerIndex: 1,
            explanation: 'A customer persona uses real data and market research to build a semi-fictional ideal customer profile.'
          },
          {
            type: 'true-false',
            question: 'The 5 Whys framework is used solely to determine product pricing.',
            options: ['True', 'False'],
            correctAnswerIndex: 1,
            explanation: 'The 5 Whys is used to find the root cause of a problem, not for pricing.'
          }
        ]),
        duration: 50,
        cohortId: null
      },
      {
        id: 'entrepreneur-2',
        title: 'Value Proposition Canvas',
        pillar: 'entrepreneur',
        description: 'Build a solid value proposition template correlating user pains to product features.',
        videoUrl: 'https://www.youtube.com/embed/ReM1uqmVfP0',
        resources: JSON.stringify([
          { name: 'Value Prop Canvas Workbook', size: '1.5 MB', link: '#' }
        ]),
        notes: JSON.stringify([
  {
    "id": "blk_amu5mgdgu",
    "type": "paragraph",
    "content": "VALUE PROPOSITION CANVAS"
  },
  {
    "id": "blk_sjs53qzt8",
    "type": "accordion",
    "title": "Learning Objectives",
    "content": "Understand the two sides of the Value Proposition Canvas.\nMap Customer Jobs, Pains, and Gains.\nDesign Products & Services, Pain Relievers, and Gain Creators."
  },
  {
    "id": "blk_h2du23btp",
    "type": "paragraph",
    "content": "THE TWO PROFILES"
  },
  {
    "id": "blk_g8zr93gxh",
    "type": "paragraph",
    "content": "|Observe the customer. Map out what tasks they are trying to perform (Jobs), what annoys them (Pains), and what outcomes they desire (Gains).|Design the value. List your Products & Services, how they alleviate customer pains (Pain Relievers), and how they create positive outcomes (Gain Creators)."
  },
  {
    "id": "blk_epuzl7zl8",
    "type": "paragraph",
    "content": "QUICK CONCEPTS"
  },
  {
    "id": "blk_63j4qe7x1",
    "type": "flipcard",
    "front": "Product-Market Fit",
    "back": "Achieved when your Value Map perfectly aligns with and satisfies your Customer Profile."
  },
  {
    "id": "blk_69a3l3lny",
    "type": "flipcard",
    "front": "Customer Jobs",
    "back": "The functional, social, or emotional tasks your customers are trying to get done."
  }
]),
        quizData: JSON.stringify([
          {
            type: 'multiple-choice',
            question: 'Which of the following belongs on the Customer Profile side of the canvas?',
            options: ['Pain Relievers', 'Products & Services', 'Customer Jobs', 'Gain Creators'],
            correctAnswerIndex: 2,
            explanation: 'Customer Jobs, Pains, and Gains belong to the Customer Profile. The others belong to the Value Map.'
          }
        ]),
        duration: 60,
        cohortId: null
      },
      // English
      {
        id: 'english-1',
        title: 'Email Etiquette & Communication',
        pillar: 'english',
        description: 'Guidelines on writing clear, professional, and grammatically correct emails.',
        videoUrl: 'https://www.youtube.com/embed/u6XAPnuFjJc',
        resources: JSON.stringify([
          { name: 'Formal Email Templates', size: '1.0 MB', link: '#' }
        ]),
        notes: JSON.stringify([
  {
    "id": "blk_umfg8548h",
    "type": "paragraph",
    "content": "PROFESSIONAL EMAIL ETIQUETTE"
  },
  {
    "id": "blk_l87yk7efr",
    "type": "accordion",
    "title": "Learning Objectives",
    "content": "Learn the standard structure of a professional email.\nUnderstand tone and appropriateness.\nWrite clear, actionable subject lines."
  },
  {
    "id": "blk_m28rc07pn",
    "type": "paragraph",
    "content": "EMAIL ANATOMY"
  },
  {
    "id": "blk_vsa97qpm0",
    "type": "paragraph",
    "content": "|Keep it concise and descriptive. e.g., \"Action Required: Quarterly Report Review\".|Always start with a professional greeting like \"Dear [Name]\" or \"Hello [Name]\".|Keep paragraphs short. Get straight to the point. Use bullet points for readability.|End professionally with \"Best regards,\" \"Sincerely,\" followed by your name and signature."
  },
  {
    "id": "blk_kkgaiwyfb",
    "type": "paragraph",
    "content": "IMPORTANT RULES"
  },
  {
    "id": "blk_umlatlb1v",
    "type": "flipcard",
    "front": "Reply All",
    "back": "Use this sparingly! Only click 'Reply All' if everyone on the thread truly needs to see your response."
  },
  {
    "id": "blk_tehzrd027",
    "type": "flipcard",
    "front": "Proofreading",
    "back": "Always read your email out loud before clicking send to catch typos or tone issues."
  }
]),
        quizData: JSON.stringify([
          {
            type: 'true-false',
            question: 'It is professional to use emojis and multiple exclamation points in a formal business email to a new client.',
            options: ['True', 'False'],
            correctAnswerIndex: 1,
            explanation: 'Keep formal emails professional. Avoid excessive punctuation and emojis until you have established a more casual rapport.'
          }
        ]),
        duration: 30,
        cohortId: null
      },
      // Life Skills
      {
        id: 'life-1',
        title: 'Goal Setting & Personal Vision',
        pillar: 'life',
        description: 'Use the SMART goals framework to draft short-term and long-term professional plans.',
        videoUrl: 'https://www.youtube.com/embed/PCRSVR11ZQQ',
        resources: JSON.stringify([
          { name: 'Personal Goals Worksheet', size: '920 KB', link: '#' }
        ]),
        notes: JSON.stringify([
  {
    "id": "blk_uvk5kaimn",
    "type": "paragraph",
    "content": "SMART GOAL SETTING"
  },
  {
    "id": "blk_72j8pd7g5",
    "type": "accordion",
    "title": "Learning Objectives",
    "content": "Understand the importance of setting clear goals.\nLearn how to break down vague goals using the SMART framework."
  },
  {
    "id": "blk_09rqgo7c5",
    "type": "paragraph",
    "content": "THE SMART FRAMEWORK"
  },
  {
    "id": "blk_1gn8ljt98",
    "type": "paragraph",
    "content": "|State exactly what you want to accomplish. Who, what, where, why?|How will you demonstrate and evaluate the extent to which the goal has been met?|Is the goal realistic given your current constraints and resources?|How does this goal tie into your broader personal or career vision?|Set one or more target dates to create urgency and prompt action."
  },
  {
    "id": "blk_4jhaebonp",
    "type": "flipcard",
    "front": "Bad Goal",
    "back": "'I want to be rich.'"
  },
  {
    "id": "blk_a0s4ulpot",
    "type": "flipcard",
    "front": "SMART Goal",
    "back": "'I will increase my income by 20% within 12 months by completing a certification and asking for a promotion.'"
  }
]),
        quizData: JSON.stringify([
          {
            type: 'multiple-choice',
            question: 'What does the "T" in SMART goals stand for?',
            options: ['Talented', 'Time-bound', 'Tough', 'Tested'],
            correctAnswerIndex: 1,
            explanation: 'Time-bound. A goal must have a deadline to create a sense of urgency.'
          }
        ]),
        duration: 40,
        cohortId: null
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
