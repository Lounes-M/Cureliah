
export const DOCUMENT_CATEGORIES = {
  contract: 'Contrat',
  invoice: 'Facture',
  certificate: 'Certificat',
  identity: 'Pièce d\'identité',
  medical: 'Document médical',
  general: 'Général'
};

export const DOCUMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

export const DOCUMENT_STATUS_LABELS = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté'
};

export const FILTER_OPTIONS = [
  { value: 'all' as const, label: 'Tous' },
  { value: 'pending' as const, label: 'En attente' },
  { value: 'approved' as const, label: 'Approuvé' },
  { value: 'rejected' as const, label: 'Rejeté' }
];
