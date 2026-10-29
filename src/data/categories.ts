import { Category } from '../types/subscription';

export interface CategoryMeta {
  id: Category;
  label: string;
  description: string;
  iconName: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'Entertainment',
    label: 'Entertainment',
    description: 'Streaming, movies, TV shows, and gaming passes',
    iconName: 'Tv',
  },
  {
    id: 'Music',
    label: 'Music & Podcasts',
    description: 'Music streaming, audiobooks, and radio services',
    iconName: 'Headphones',
  },
  {
    id: 'Productivity',
    label: 'Productivity',
    description: 'Workspaces, storage, design tools, and notes',
    iconName: 'Briefcase',
  },
  {
    id: 'Education',
    label: 'Education',
    description: 'Learning platforms, languages, and courses',
    iconName: 'GraduationCap',
  },
  {
    id: 'Shopping',
    label: 'Shopping & Memberships',
    description: 'Fast delivery clubs, wholesale passes, and VIP tiers',
    iconName: 'ShoppingBag',
  },
  {
    id: 'Fitness',
    label: 'Fitness & Wellness',
    description: 'Gyms, meditation apps, workouts, and nutrition trackers',
    iconName: 'Activity',
  },
  {
    id: 'Software',
    label: 'Software & Dev',
    description: 'Cloud hosting, SaaS, AI tools, and developer utilities',
    iconName: 'Code',
  },
  {
    id: 'Other',
    label: 'Other',
    description: 'Magazines, news, subscriptions, and custom recurring expenses',
    iconName: 'Layers',
  },
];
