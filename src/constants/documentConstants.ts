
export const categories = [
  { value: 'contract', label: 'Contrat' },
  { value: 'invoice', label: 'Facture' },
  { value: 'certificate', label: 'Certificat' },
  { value: 'identity', label: 'Pièce d\'identité' },
  { value: 'medical', label: 'Document médical' },
  { value: 'general', label: 'Général' }
];

export const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

export const statusLabels = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté'
};
