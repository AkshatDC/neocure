import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NeoCure API',
      version: '1.0.0',
      description: 'API documentation for NeoCure backend',
    },
    servers: [
      { url: '/api' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['src/routes/**/*.ts', 'src/controllers/**/*.ts', 'dist/routes/**/*.js', 'dist/controllers/**/*.js'],
};

export const swaggerSpec = swaggerJSDoc(options);
