import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'GitHub Repo Analyzer API',
    version: '1.0.0',
    description: 'API that analyzes public GitHub repositories.',
  },
};

const options = {
    swaggerDefinition,
    apis: ['./src/api/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);