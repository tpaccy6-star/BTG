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
  lastLoginDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cohortId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  assignedMentorId: {
    type: DataTypes.UUID,
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
  quizData: {
    type: DataTypes.TEXT, // JSON stringified quiz questions
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
  },
  targetRole: {
    type: DataTypes.STRING, // 'all', 'scholar', 'mentor', 'teacher'
    defaultValue: 'all'
  },
  targetCohortId: {
    type: DataTypes.INTEGER, // specific cohort or null for all cohorts
    allowNull: true
  }
});

// --- Notification Model ---
export const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  type: {
    type: DataTypes.STRING, // e.g., 'announcement', 'grading', 'system'
    defaultValue: 'system'
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true
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
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

const programTimestamps = {
  timestamps: true,
  underscored: true
};

export const ProgramReport = sequelize.define('ProgramReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  beneficiaryId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'beneficiary_id'
  },
  title: {
    type: DataTypes.STRING(160),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Pending'
  },
  staffFeedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'staff_feedback'
  }
}, { ...programTimestamps, tableName: 'program_reports' });

export const ProgramAcademicResult = sequelize.define('ProgramAcademicResult', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  beneficiaryId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'beneficiary_id'
  },
  school: {
    type: DataTypes.STRING(160),
    allowNull: false
  },
  academicYear: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'academic_year'
  },
  term: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: 0 }
  },
  maxScore: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: 'max_score',
    validate: { min: 0.000001 }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Pending'
  },
  staffFeedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'staff_feedback'
  }
}, { ...programTimestamps, tableName: 'program_academic_results' });

export const ProgramFriendlyWeek = sequelize.define('ProgramFriendlyWeek', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  beneficiaryOneId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'beneficiary_one_id'
  },
  beneficiaryTwoId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'beneficiary_two_id'
  },
  weekStart: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'week_start'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, { ...programTimestamps, tableName: 'program_friendly_weeks' });

export const ProgramMentorship = sequelize.define('ProgramMentorship', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  beneficiaryId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'beneficiary_id'
  },
  cohortId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'cohort_id'
  },
  mentorName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'mentor_name'
  },
  goal: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  nextSession: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'next_session'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, { ...programTimestamps, tableName: 'program_mentorships' });

export const ProgramAssistance = sequelize.define('ProgramAssistance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  beneficiaryId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'beneficiary_id'
  },
  supportType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'support_type'
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'RWF'
  },
  supportDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'support_date'
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Delivered'
  }
}, { ...programTimestamps, tableName: 'program_assistance' });

export const ProgramAttachment = sequelize.define('ProgramAttachment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reportId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'report_id'
  },
  academicResultId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'academic_result_id'
  },
  uploadedById: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'uploaded_by_id'
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'file_name'
  },
  storageKey: {
    type: DataTypes.STRING(80),
    allowNull: false,
    unique: true,
    field: 'storage_key'
  },
  contentType: {
    type: DataTypes.STRING(120),
    allowNull: false,
    field: 'content_type'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'file_size'
  }
}, {
  ...programTimestamps,
  tableName: 'program_attachments',
  validate: {
    exactlyOneRecord() {
      if (Boolean(this.reportId) === Boolean(this.academicResultId)) {
        throw new Error('Attachment must belong to exactly one record.');
      }
    }
  }
});

// --- Associations ---
User.hasMany(Submission, { foreignKey: 'scholarId', as: 'submissions' });
Submission.belongsTo(User, { foreignKey: 'scholarId', as: 'scholar' });

User.belongsTo(User, { as: 'mentor', foreignKey: 'assignedMentorId' });
User.hasMany(User, { as: 'assignedScholars', foreignKey: 'assignedMentorId' });

Lesson.hasMany(Submission, { foreignKey: 'lessonId', as: 'submissions' });
Submission.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

User.hasMany(Attendance, { foreignKey: 'scholarId', as: 'attendanceRecords' });
Attendance.belongsTo(User, { foreignKey: 'scholarId', as: 'scholar' });

Cohort.hasMany(User, { foreignKey: 'cohortId', as: 'scholarsList' });
User.belongsTo(Cohort, { foreignKey: 'cohortId', as: 'cohort' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ProgramReport, { foreignKey: 'beneficiaryId', as: 'programReports' });
ProgramReport.belongsTo(User, { foreignKey: 'beneficiaryId', as: 'beneficiary' });
ProgramReport.hasMany(ProgramAttachment, { foreignKey: 'reportId', as: 'attachments' });
ProgramAttachment.belongsTo(ProgramReport, { foreignKey: 'reportId', as: 'report' });

User.hasMany(ProgramAcademicResult, { foreignKey: 'beneficiaryId', as: 'programAcademicResults' });
ProgramAcademicResult.belongsTo(User, { foreignKey: 'beneficiaryId', as: 'beneficiary' });
ProgramAcademicResult.hasMany(ProgramAttachment, { foreignKey: 'academicResultId', as: 'attachments' });
ProgramAttachment.belongsTo(ProgramAcademicResult, { foreignKey: 'academicResultId', as: 'academicResult' });
ProgramAttachment.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });

User.hasMany(ProgramFriendlyWeek, { foreignKey: 'beneficiaryOneId', as: 'friendlyWeeksAsFirst' });
User.hasMany(ProgramFriendlyWeek, { foreignKey: 'beneficiaryTwoId', as: 'friendlyWeeksAsSecond' });
ProgramFriendlyWeek.belongsTo(User, { foreignKey: 'beneficiaryOneId', as: 'beneficiaryOne' });
ProgramFriendlyWeek.belongsTo(User, { foreignKey: 'beneficiaryTwoId', as: 'beneficiaryTwo' });

User.hasMany(ProgramMentorship, { foreignKey: 'beneficiaryId', as: 'programMentorships' });
ProgramMentorship.belongsTo(User, { foreignKey: 'beneficiaryId', as: 'beneficiary' });
Cohort.hasMany(ProgramMentorship, { foreignKey: 'cohortId', as: 'programMentorships' });
ProgramMentorship.belongsTo(Cohort, { foreignKey: 'cohortId', as: 'cohort' });

User.hasMany(ProgramAssistance, { foreignKey: 'beneficiaryId', as: 'programAssistance' });
ProgramAssistance.belongsTo(User, { foreignKey: 'beneficiaryId', as: 'beneficiary' });

export default {
  User, Lesson, Submission, Message, Attendance, Announcement, Notification, Cohort,
  ProgramReport, ProgramAcademicResult, ProgramFriendlyWeek, ProgramMentorship,
  ProgramAssistance, ProgramAttachment
};
