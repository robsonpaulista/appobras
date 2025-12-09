// Handler para Vercel Serverless Functions
import app from '../server.js';

// Exportar handler para Vercel
// O Vercel espera uma função que recebe req e res
export default (req, res) => {
  return app(req, res);
};

