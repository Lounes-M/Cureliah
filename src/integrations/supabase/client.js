// Fichier JS pour Jest : exporte le mock si NODE_ENV === 'test', sinon importe le vrai client TS
if (process.env.NODE_ENV === 'test') {
  module.exports = require('../../../__mocks__/src/integrations/supabase/client.ts');
} else {
  module.exports = require('./client.ts');
}
