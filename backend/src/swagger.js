const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EduShield API',
      version: '1.0.0',
      description: 'Sistem Peringatan Dini Perundungan Sekolah berbasis Machine Learning',
      contact: {
        name: 'EduShield',
        url: 'http://localhost:5173'
      }
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development server' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        School: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            address: { type: 'string' },
            phone: { type: 'string' }
          }
        },
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'SMA Negeri 1 Jakarta' },
            email: { type: 'string', format: 'email', example: 'sma1@sch.id' },
            password: { type: 'string', minLength: 6, example: 'rahasia123' }
          }
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'sma1@sch.id' },
            password: { type: 'string', example: 'rahasia123' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string' },
            school: { $ref: '#/components/schemas/School' }
          }
        },
        StudentInput: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Andi Pratama' },
            grade: { type: 'string', example: '10' },
            sex: { type: 'string', enum: ['Male', 'Female'], example: 'Male' },
            age: { type: 'string', example: '15 years old' },
            physically_attacked: { type: 'string', example: '0 times' },
            physical_fighting: { type: 'string', example: '0 times' },
            felt_lonely: { type: 'string', example: 'Never' },
            close_friends: { type: 'string', example: '3 or more' },
            parents_understand_problems: { type: 'string', example: 'Sometimes' },
            cyber_bullied: { type: 'string', enum: ['No', 'Yes'], example: 'No' },
            bullied_not_on_school_property: { type: 'string', enum: ['No', 'Yes'], example: 'No' }
          }
        },
        Student: {
          allOf: [
            { $ref: '#/components/schemas/StudentInput' },
            {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                school_id: { type: 'string', format: 'uuid' },
                risk_score: { type: 'number', format: 'float' },
                risk_level: { type: 'string', enum: ['High', 'Medium', 'Low'] }
              }
            }
          ]
        },
        PredictionResult: {
          type: 'object',
          properties: {
            prediction: { type: 'string', enum: ['Yes', 'No'] },
            risk_score: { type: 'number', format: 'float' },
            risk_level: { type: 'string', enum: ['High', 'Medium', 'Low'] },
            risk_factors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  factor: { type: 'string' },
                  importance: { type: 'number', format: 'float' }
                }
              }
            }
          }
        },
        InterventionInput: {
          type: 'object',
          properties: {
            student_id: { type: 'string', format: 'uuid', example: 'uuid-siswa' },
            type: { type: 'string', enum: ['Konseling', 'Mentoring', 'Pertemuan Orang Tua', 'Dukungan Teman', 'Pemantauan Guru', 'Lainnya'] },
            description: { type: 'string' },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['Direncanakan', 'Aktif', 'Selesai', 'Dibatalkan'] }
          }
        },
        Intervention: {
          allOf: [
            { $ref: '#/components/schemas/InterventionInput' },
            {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                school_id: { type: 'string', format: 'uuid' },
                student_name: { type: 'string' }
              }
            }
          ]
        },
        Report: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            report_type: { type: 'string' },
            period: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            summary: { type: 'object' }
          }
        },
        DashboardData: {
          type: 'object',
          properties: {
            total_students: { type: 'integer' },
            risk_distribution: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  risk_level: { type: 'string' },
                  count: { type: 'integer' }
                }
              }
            },
            risk_factors: {
              type: 'object',
              properties: {
                lonely_count: { type: 'integer' },
                few_friends_count: { type: 'integer' },
                low_parental_support: { type: 'integer' },
                physically_attacked_count: { type: 'integer' }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Registrasi dan login sekolah' },
      { name: 'Schools', description: 'Profil sekolah' },
      { name: 'Students', description: 'Manajemen data siswa' },
      { name: 'Predictions', description: 'Prediksi risiko perundungan' },
      { name: 'Analytics', description: 'Dashboard dan analitik' },
      { name: 'Interventions', description: 'Manajemen intervensi' },
      { name: 'Reports', description: 'Laporan' }
    ]
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsdoc(options);
