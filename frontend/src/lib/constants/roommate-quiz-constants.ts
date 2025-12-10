/**
 * Personality Quiz Questions Configuration
 * 10 fun, high-impact questions for roommate matching
 */

import { 
  Moon, 
  Sun, 
  Clock, 
  Sparkles, 
  Home, 
  Trash2, 
  CheckCircle2, 
  BookOpen, 
  Library, 
  Coffee, 
  Trees, 
  Volume2, 
  VolumeX, 
  Music, 
  UtensilsCrossed, 
  Pizza, 
  ChefHat, 
  Users, 
  Gamepad2, 
  HeartHandshake, 
  Dog, 
  Ban, 
  PartyPopper, 
  Tv, 
  GraduationCap,
  Sofa,
  Laptop,
  Smile
} from 'lucide-react';

export type QuestionId =
  | 'weekendVibe'
  | 'sleepSchedule'
  | 'cleanliness'
  | 'studySpot'
  | 'noiseTolerance'
  | 'foodMood'
  | 'socialPreference'
  | 'petPreference'
  | 'fridayNight'
  | 'roomStyle';

export interface QuizOption {
  id: string;
  label: string;
  icon: any; // Lucide icon component
  description?: string;
  image?: string; // Path to image in public folder
}

export interface QuizQuestion {
  id: QuestionId;
  question: string;
  subtitle?: string;
  options: QuizOption[];
  weight: number; // Percentage weight in compatibility calculation (total should be 100)
  category: 'lifestyle' | 'personality' | 'preferences' | 'aesthetics';
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'weekendVibe',
    question: 'What\'s your ideal weekend vibe?',
    subtitle: 'How do you prefer to recharge?',
    weight: 8,
    category: 'lifestyle',
    options: [
      {
        id: 'netflix',
        label: 'Netflix & Chill',
        icon: Tv,
        description: 'Relaxing at home with shows',
        image: '/images/grid-image/image-01.png',
      },
      {
        id: 'party',
        label: 'Party',
        icon: PartyPopper,
        description: 'Going out and socializing',
        image: '/images/grid-image/image-02.png',
      },
      {
        id: 'study',
        label: 'Study Session',
        icon: BookOpen,
        description: 'Catching up on coursework',
        image: '/images/grid-image/image-03.png',
      },
      {
        id: 'outdoor',
        label: 'Outdoor Adventure',
        icon: Trees,
        description: 'Hiking, sports, exploring',
        image: '/images/grid-image/image-04.png',
      },
    ],
  },
  {
    id: 'sleepSchedule',
    question: 'When do you sleep?',
    subtitle: 'Your natural sleep rhythm',
    weight: 15,
    category: 'lifestyle',
    options: [
      {
        id: 'early_bird',
        label: 'Early Bird',
        icon: Sun,
        description: 'Asleep by 10pm, up at 6am',
      },
      {
        id: 'night_owl',
        label: 'Night Owl',
        icon: Moon,
        description: 'Sleep after midnight, wake late',
      },
      {
        id: 'flexible',
        label: 'Flexible',
        icon: Clock,
        description: 'It varies day to day',
      },
      {
        id: 'catnapper',
        label: 'Catnapper',
        icon: Sparkles,
        description: 'Short naps throughout the day',
      },
    ],
  },
  {
    id: 'cleanliness',
    question: 'Room cleanliness style?',
    subtitle: 'How tidy do you keep your space?',
    weight: 20,
    category: 'preferences',
    options: [
      {
        id: 'messy',
        label: 'Messy',
        icon: Trash2,
        description: 'Organized chaos works for me',
      },
      {
        id: 'average',
        label: 'Average',
        icon: Home,
        description: 'Clean weekly, lived-in feel',
      },
      {
        id: 'neat',
        label: 'Neat',
        icon: Sparkles,
        description: 'Everything has its place',
      },
      {
        id: 'ocd_level',
        label: 'OCD-level',
        icon: CheckCircle2,
        description: 'Spotless at all times',
      },
    ],
  },
  {
    id: 'studySpot',
    question: 'Favorite study spot?',
    subtitle: 'Where do you focus best?',
    weight: 8,
    category: 'preferences',
    options: [
      {
        id: 'library',
        label: 'Library',
        icon: Library,
        description: 'Quiet, academic vibes',
        image: '/images/grid-image/image-05.png',
      },
      {
        id: 'room_desk',
        label: 'Room Desk',
        icon: Laptop,
        description: 'My own private space',
      },
      {
        id: 'cafeteria',
        label: 'Cafeteria',
        icon: Coffee,
        description: 'Background noise helps',
      },
      {
        id: 'outdoors',
        label: 'Outdoors',
        icon: Trees,
        description: 'Fresh air and nature',
      },
    ],
  },
  {
    id: 'noiseTolerance',
    question: 'Noise tolerance level?',
    subtitle: 'How much sound can you handle?',
    weight: 10,
    category: 'preferences',
    options: [
      {
        id: 'silent',
        label: 'Silent',
        icon: VolumeX,
        description: 'Need total quiet to function',
      },
      {
        id: 'moderate',
        label: 'Moderate',
        icon: Volume2,
        description: 'Some noise is okay',
      },
      {
        id: 'background_chatter',
        label: 'Background Chatter',
        icon: Users,
        description: 'Noise doesn\'t bother me',
      },
      {
        id: 'music_lover',
        label: 'Music Lover',
        icon: Music,
        description: 'Always have music playing',
      },
    ],
  },
  {
    id: 'foodMood',
    question: 'What\'s your food mood?',
    subtitle: 'How do you handle meals?',
    weight: 8,
    category: 'lifestyle',
    options: [
      {
        id: 'snacks_only',
        label: 'Snacks Only',
        icon: Pizza,
        description: 'Quick bites throughout the day',
      },
      {
        id: 'home_cooked',
        label: 'Home-cooked Meals',
        icon: ChefHat,
        description: 'Love to cook regularly',
      },
      {
        id: 'fast_food',
        label: 'Fast Food',
        icon: UtensilsCrossed,
        description: 'Ordering in is life',
      },
      {
        id: 'gourmet',
        label: 'Gourmet',
        icon: UtensilsCrossed,
        description: 'Foodie who experiments',
      },
    ],
  },
  {
    id: 'socialPreference',
    question: 'Social preference?',
    subtitle: 'How social are you?',
    weight: 15,
    category: 'personality',
    options: [
      {
        id: 'always_social',
        label: 'Always Social',
        icon: Users,
        description: 'Friends over constantly',
      },
      {
        id: 'sometimes_social',
        label: 'Sometimes Social',
        icon: HeartHandshake,
        description: 'Balance of social and alone time',
      },
      {
        id: 'mostly_alone',
        label: 'Mostly Alone',
        icon: Home,
        description: 'Prefer my own company',
      },
      {
        id: 'chill_gamer',
        label: 'Chill Gamer',
        icon: Gamepad2,
        description: 'Online friends count, right?',
      },
    ],
  },
  {
    id: 'petPreference',
    question: 'Pet preference?',
    subtitle: 'How do you feel about pets?',
    weight: 8,
    category: 'preferences',
    options: [
      {
        id: 'love_pets',
        label: 'Love Pets',
        icon: Dog,
        description: 'Bring on the fur babies!',
        image: '/images/grid-image/image-06.png',
      },
      {
        id: 'okay_with_pets',
        label: 'Okay with Pets',
        icon: Smile,
        description: 'Don\'t mind them',
      },
      {
        id: 'allergic',
        label: 'Allergic',
        icon: Ban,
        description: 'Health issues with pets',
      },
      {
        id: 'no_pets',
        label: 'No Pets',
        icon: Ban,
        description: 'Prefer pet-free zones',
      },
    ],
  },
  {
    id: 'fridayNight',
    question: 'Friday night activity?',
    subtitle: 'How do you kick off the weekend?',
    weight: 4,
    category: 'lifestyle',
    options: [
      {
        id: 'hanging_with_friends',
        label: 'Hanging with Friends',
        icon: Users,
        description: 'Social gathering time',
      },
      {
        id: 'gaming',
        label: 'Gaming',
        icon: Gamepad2,
        description: 'Level up all night',
      },
      {
        id: 'studying',
        label: 'Studying',
        icon: GraduationCap,
        description: 'Get ahead for next week',
      },
      {
        id: 'watching_shows',
        label: 'Watching Shows',
        icon: Tv,
        description: 'Binge that new series',
      },
    ],
  },
  {
    id: 'roomStyle',
    question: 'Room style preference?',
    subtitle: 'What aesthetic speaks to you?',
    weight: 4,
    category: 'aesthetics',
    options: [
      {
        id: 'minimalist',
        label: 'Minimalist',
        icon: Sparkles,
        description: 'Less is more',
      },
      {
        id: 'cozy',
        label: 'Cozy',
        icon: Sofa,
        description: 'Warm and comfortable',
      },
      {
        id: 'funky',
        label: 'Funky',
        icon: PartyPopper,
        description: 'Bold colors and personality',
      },
      {
        id: 'techy_modern',
        label: 'Techy/Modern',
        icon: Laptop,
        description: 'Sleek and digital',
      },
    ],
  },
];

// Validate weights sum to 100
const totalWeight = QUIZ_QUESTIONS.reduce((sum, q) => sum + q.weight, 0);
if (totalWeight !== 100) {
  console.warn(`Quiz weights sum to ${totalWeight}%, expected 100%`);
}

export const QUIZ_METADATA = {
  totalQuestions: QUIZ_QUESTIONS.length,
  estimatedMinutes: 3,
  version: '1.0.0',
};
