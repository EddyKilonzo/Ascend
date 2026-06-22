import { PrismaClient, HabitCategory, AchievementRarity, SkillCategory, ChallengeType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSkills() {
  const skills = [
    { name: 'Discipline',    category: SkillCategory.DISCIPLINE, description: 'Ability to follow through on commitments' },
    { name: 'Focus',         category: SkillCategory.FOCUS,      description: 'Ability to maintain deep concentration' },
    { name: 'Fitness',       category: SkillCategory.FITNESS,    description: 'Physical health and endurance' },
    { name: 'Learning',      category: SkillCategory.LEARNING,   description: 'Rate of acquiring new knowledge' },
    { name: 'Career',        category: SkillCategory.CAREER,     description: 'Professional growth and output' },
    { name: 'Finance',       category: SkillCategory.FINANCE,    description: 'Financial discipline and awareness' },
    { name: 'Social',        category: SkillCategory.SOCIAL,     description: 'Relationship building and communication' },
    { name: 'Health',        category: SkillCategory.HEALTH,     description: 'Overall mental and physical wellbeing' },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where:  { name: skill.name },
      update: {},
      create: skill,
    });
  }
  console.log('Skills seeded');
}

async function seedAchievements() {
  const achievements = [
    { slug: 'first-habit',       name: 'First Habit',         description: 'Create your first habit',          rarity: AchievementRarity.COMMON,    xpReward: 25,  criteria: { type: 'habit_created', count: 1 } },
    { slug: 'streak-7',          name: '7-Day Streak',        description: 'Maintain a 7-day habit streak',    rarity: AchievementRarity.COMMON,    xpReward: 50,  criteria: { type: 'streak', days: 7 } },
    { slug: 'streak-30',         name: '30-Day Streak',       description: 'Maintain a 30-day habit streak',   rarity: AchievementRarity.RARE,      xpReward: 200, criteria: { type: 'streak', days: 30 } },
    { slug: 'streak-100',        name: 'Century Streak',      description: '100-day streak — relentless',      rarity: AchievementRarity.EPIC,      xpReward: 500, criteria: { type: 'streak', days: 100 } },
    { slug: 'deep-work-master',  name: 'Deep Work Master',    description: 'Complete 50 focus sessions',        rarity: AchievementRarity.RARE,      xpReward: 150, criteria: { type: 'focus_sessions', count: 50 } },
    { slug: 'productivity-beast',name: 'Productivity Beast',  description: 'Score 90+ productivity 7 days',    rarity: AchievementRarity.EPIC,      xpReward: 300, criteria: { type: 'productivity_score', threshold: 90, days: 7 } },
    { slug: 'goal-crusher',      name: 'Goal Crusher',        description: 'Complete your first goal',         rarity: AchievementRarity.COMMON,    xpReward: 75,  criteria: { type: 'goal_completed', count: 1 } },
    { slug: 'habit-collector',   name: 'Habit Collector',     description: 'Create 10 habits',                 rarity: AchievementRarity.RARE,      xpReward: 100, criteria: { type: 'habit_created', count: 10 } },
    { slug: 'level-10',          name: 'Level 10',            description: 'Reach level 10',                   rarity: AchievementRarity.RARE,      xpReward: 200, criteria: { type: 'level', threshold: 10 } },
    { slug: 'level-50',          name: 'Ascendant',           description: 'Reach level 50',                   rarity: AchievementRarity.LEGENDARY, xpReward: 1000, criteria: { type: 'level', threshold: 50 } },
    { slug: 'trust-keeper',      name: 'Trust Keeper',        description: 'Complete 10 commitments',          rarity: AchievementRarity.RARE,      xpReward: 150, criteria: { type: 'commitment_completed', count: 10 } },
    { slug: 'early-bird',        name: 'Early Bird',          description: 'Complete habits before 8am x7',   rarity: AchievementRarity.RARE,      xpReward: 100, criteria: { type: 'early_completion', days: 7 } },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where:  { slug: a.slug },
      update: {},
      create: a,
    });
  }
  console.log('Achievements seeded');
}

async function seedChallenges() {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  await prisma.challenge.upsert({
    where:  { slug: 'daily-focus-sprint' },
    update: {},
    create: {
      slug:        'daily-focus-sprint',
      title:       'Daily Focus Sprint',
      description: 'Complete at least one focus session every day this week',
      type:        ChallengeType.WEEKLY,
      xpReward:    75,
      criteria:    { type: 'focus_sessions_per_day', count: 1, days: 7 },
      startsAt:    now,
      endsAt:      endOfMonth,
    },
  });

  await prisma.challenge.upsert({
    where:  { slug: 'habit-perfectionist' },
    update: {},
    create: {
      slug:        'habit-perfectionist',
      title:       'Habit Perfectionist',
      description: 'Complete all habits for 5 consecutive days',
      type:        ChallengeType.WEEKLY,
      xpReward:    100,
      criteria:    { type: 'all_habits_complete', days: 5 },
      startsAt:    now,
      endsAt:      endOfMonth,
    },
  });

  console.log('Challenges seeded');
}

async function main() {
  try {
    console.log('Starting database seed...');
    await seedSkills();
    await seedAchievements();
    await seedChallenges();
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
