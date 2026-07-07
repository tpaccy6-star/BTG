import { DataTypes } from 'sequelize';
import sequelize from './database.js';

// --- User Model ---
export const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('scholar', 'mentor', 'teacher', 'admin'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  initials: {
    type: DataTypes.STRING,
    allowNull: false
  },
  university: {
    type: DataTypes.STRING,
    allowNull: true
  },
  yearLevel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  streakDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cohortId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

// --- Lesson Model ---
export const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pillar: {
    type: DataTypes.STRING,
    allowNull: false // 'career', 'entrepreneur', 'english', 'life'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resources: {
    type: DataTypes.TEXT, // JSON stringified resources
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT, // Rich text notes
    allowNull: true
  },
  videoRestrictions: {
    type: DataTypes.TEXT, // JSON stringified restrictions
    allowNull: true,
    defaultValue: '{}'
  },
  duration: {
    type: DataTypes.INTEGER, // duration in minutes
    defaultValue: 30
  },
  cohortId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  coverUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// --- Submission Model ---
export const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('due', 'completed', 'graded'),
    defaultValue: 'due'
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

// --- Message Model ---
export const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  senderId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senderName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  recipientId: {
    type: DataTypes.STRING,
    allowNull: false // e.g. 'mentor-all', or specific scholar ID
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// --- Attendance Model ---
export const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('present', 'late', 'absent'),
    allowNull: false
  },
  verifiedBy: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// --- Announcement Model ---
export const Announcement = sequelize.define('Announcement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
});

// --- Cohort Model ---
export const Cohort = sequelize.define('Cohort', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  scholars: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active'
  },
  attendance: {
    type: DataTypes.INTEGER,
    defaultValue: 90
  },
  university: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// --- Associations ---
User.hasMany(Submission, { foreignKey: 'scholarId', as: 'submissions' });
Submission.belongsTo(User, { foreignKey: 'scholarId', as: 'scholar' });

Lesson.hasMany(Submission, { foreignKey: 'lessonId', as: 'submissions' });
Submission.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

User.hasMany(Attendance, { foreignKey: 'scholarId', as: 'attendanceRecords' });
Attendance.belongsTo(User, { foreignKey: 'scholarId', as: 'scholar' });

Cohort.hasMany(User, { foreignKey: 'cohortId', as: 'scholarsList' });
User.belongsTo(Cohort, { foreignKey: 'cohortId', as: 'cohort' });

export default { User, Lesson, Submission, Message, Attendance, Announcement, Cohort };
