/**
 * Données fictives (Mock Data) pour le feed de découverte.
 * Profils de démonstration avec photos, prénoms, âges et bios.
 * Prêts à être remplacés par des données réelles de Supabase.
 */

export interface MockProfile {
  id: string;
  firstName: string;
  age: number;
  bio: string;
  photoUrl: string;
  city: string;
  distance: number; // km
  interests: string[];
}

export const mockProfiles: MockProfile[] = [
  {
    id: "1",
    firstName: "Aïcha",
    age: 24,
    bio: "Passionnée de cuisine africaine et de voyages. Je cherche quelqu'un avec qui explorer Abidjan et au-delà.",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop",
    city: "Abidjan",
    distance: 3,
    interests: ["Cuisine", "Voyages", "Musique"],
  },
  {
    id: "2",
    firstName: "Koffi",
    age: 28,
    bio: "Entrepreneur dans la tech. J'aime le sport, les bonnes conversations et les soirées tranquilles.",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop",
    city: "Abidjan",
    distance: 5,
    interests: ["Tech", "Sport", "Cinéma"],
  },
  {
    id: "3",
    firstName: "Fatou",
    age: 26,
    bio: "Étudiante en marketing. Danseuse le week-end. Je crois en la confiance avant tout.",
    photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop",
    city: "Bouaké",
    distance: 12,
    interests: ["Danse", "Marketing", "Lecture"],
  },
  {
    id: "4",
    firstName: "Yao",
    age: 31,
    bio: "Architecte et amoureux de la nature. Je cherche une relation sérieuse basée sur la confiance.",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
    city: "Yamoussoukro",
    distance: 25,
    interests: ["Architecture", "Nature", "Photographie"],
  },
  {
    id: "5",
    firstName: "Mariam",
    age: 23,
    bio: "Infirmière dévouée. Famille avant tout. Je cherche quelqu'un de sincère et attentionné.",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-2cf94b28b3f8?w=600&h=800&fit=crop",
    city: "Abidjan",
    distance: 2,
    interests: ["Santé", "Famille", "Cuisine"],
  },
  {
    id: "6",
    firstName: "Konan",
    age: 29,
    bio: "Musicien et producteur. La musique est ma vie. Cherche quelqu'un qui aime rire et profiter de la vie.",
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84e45f5cd?w=600&h=800&fit=crop",
    city: "Abidjan",
    distance: 8,
    interests: ["Musique", "Concerts", "Plage"],
  },
  {
    id: "7",
    firstName: "Adjoua",
    age: 25,
    bio: "Graphiste créative. J'aime l'art, la mode et les nouvelles rencontres authentiques.",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop",
    city: "Abidjan",
    distance: 4,
    interests: ["Art", "Mode", "Design"],
  },
  {
    id: "8",
    firstName: "Serge",
    age: 33,
    bio: "Professeur et père d'un garçon. Je valorise l'honnêteté et la bienveillance dans toute relation.",
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop",
    city: "San-Pédro",
    distance: 45,
    interests: ["Éducation", "Football", "Lecture"],
  },
];
