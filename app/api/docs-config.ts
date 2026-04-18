import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SEO Blueprint Generator API',
      version: '1.0.0',
      description: 'API experte pour la génération de packs SEO techniques multi-fichiers basés sur les standards 2026.',
    },
    servers: [
      {
        url: '/api',
        description: 'Serveur local',
      },
    ],
  },
  apis: ['./app/api/**/*.ts'], // Chemin vers les fichiers contenant des annotations Swagger
};

export const spec = swaggerJsdoc(options);
