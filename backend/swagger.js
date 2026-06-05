const swaggerAutogen = require('swagger-autogen')({openapi: '3.0.0'});

const doc = {
    info: {
      title: 'fastFood API',
      description: 'Swagger delle api del progetto FastFood di PWM 2026 di Blanc Samuele'
    },
    host: 'localhost:3000'
  };

const outputFile = './swagger.json';
const inputFiles = ['./main.js'];

swaggerAutogen(outputFile, inputFiles, doc);
