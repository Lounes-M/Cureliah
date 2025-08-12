// Utilitaire pour gérer les erreurs Stripe bloquées par les bloqueurs de publicité
export class StripeErrorHandler {
  static isBlocked(error: any): boolean {
    if (typeof error === 'string') {
      return error.includes('ERR_BLOCKED_BY_CLIENT') || 
             error.includes('Failed to fetch') ||
             error.includes('NetworkError');
    }
    
    if (error && error.message) {
      return error.message.includes('ERR_BLOCKED_BY_CLIENT') ||
             error.message.includes('Failed to fetch') ||
             error.message.includes('NetworkError') ||
             error.message.includes('stripe.com');
    }
    
    return false;
  }

  static getBlockedMessage(): string {
    return `
      Il semble que votre navigateur bloque Stripe. 
      Veuillez désactiver votre bloqueur de publicité sur ce site 
      ou ajouter *.stripe.com à votre liste blanche, puis réessayer.
    `.trim();
  }

  static showBlockedNotification() {
    // Créer une notification visible pour l'utilisateur
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fef3cd;
      border: 1px solid #faebcc;
      color: #8a6d3b;
      padding: 15px;
      border-radius: 8px;
      max-width: 400px;
      z-index: 10000;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="font-size: 24px;">⚠️</div>
        <div>
          <strong>Paiement bloqué</strong><br>
          ${this.getBlockedMessage()}
          <div style="margin-top: 10px;">
            <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                    style="background: #8a6d3b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
              Compris
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove après 15 secondes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 15000);
  }
}
