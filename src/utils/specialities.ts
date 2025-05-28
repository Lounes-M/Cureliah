
export const SPECIALITIES = {
  cardiology: {
    label: 'Cardiologie',
    description: 'Spécialité médicale qui étudie le cœur et ses maladies',
    color: 'bg-red-100 text-red-800'
  },
  neurology: {
    label: 'Neurologie',
    description: 'Spécialité médicale qui étudie le système nerveux',
    color: 'bg-purple-100 text-purple-800'
  },
  orthopedics: {
    label: 'Orthopédie',
    description: 'Spécialité chirurgicale des os et articulations',
    color: 'bg-blue-100 text-blue-800'
  },
  pediatrics: {
    label: 'Pédiatrie',
    description: 'Médecine spécialisée dans les soins aux enfants',
    color: 'bg-pink-100 text-pink-800'
  },
  psychiatry: {
    label: 'Psychiatrie',
    description: 'Spécialité médicale dédiée à la santé mentale',
    color: 'bg-indigo-100 text-indigo-800'
  },
  radiology: {
    label: 'Radiologie',
    description: 'Spécialité médicale utilisant l\'imagerie médicale',
    color: 'bg-gray-100 text-gray-800'
  },
  surgery: {
    label: 'Chirurgie',
    description: 'Spécialité médicale pratiquant les interventions chirurgicales',
    color: 'bg-green-100 text-green-800'
  },
  general_medicine: {
    label: 'Médecine Générale',
    description: 'Médecine de premier recours et de soins globaux',
    color: 'bg-yellow-100 text-yellow-800'
  },
  dermatology: {
    label: 'Dermatologie',
    description: 'Spécialité médicale de la peau et des phanères',
    color: 'bg-orange-100 text-orange-800'
  },
  gynecology: {
    label: 'Gynécologie',
    description: 'Spécialité médicale de l\'appareil génital féminin',
    color: 'bg-rose-100 text-rose-800'
  }
} as const;

export const ESTABLISHMENT_TYPES = {
  hospital: {
    label: 'Hôpital',
    description: 'Établissement de soins public ou privé',
    icon: 'Building2'
  },
  clinic: {
    label: 'Clinique',
    description: 'Établissement de soins privé',
    icon: 'Building'
  },
  private_practice: {
    label: 'Cabinet Privé',
    description: 'Cabinet médical privé',
    icon: 'Home'
  },
  medical_center: {
    label: 'Centre Médical',
    description: 'Centre de soins pluridisciplinaire',
    icon: 'MapPin'
  }
} as const;

export const getSpecialityInfo = (speciality: string) => {
  return SPECIALITIES[speciality as keyof typeof SPECIALITIES] || {
    label: speciality,
    description: '',
    color: 'bg-gray-100 text-gray-800'
  };
};

export const getEstablishmentTypeInfo = (type: string) => {
  return ESTABLISHMENT_TYPES[type as keyof typeof ESTABLISHMENT_TYPES] || {
    label: type,
    description: '',
    icon: 'Building2'
  };
};
