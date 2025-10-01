const apiSpec = {
  openapi: '3.0.1',
  info: {
    title: 'Agiota System API',
    version: '1.0.0',
    description:
      'Documentação da API do Agiota System. Todas as rotas (exceto autenticação e saúde) exigem o envio do token JWT no header Authorization.'
  },
  servers: [{ url: '/api', description: 'Aplicação atual' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          token: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' }
            }
          }
        }
      },
      Profile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {}
        }
      }
    }
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'Realiza login e retorna token JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' }
            }
          }
        },
        responses: {
          200: {
            description: 'Login realizado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          401: { description: 'Credenciais inválidas' }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Recupera o perfil do usuário autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Perfil retornado',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/Profile' }
                      }
                    }
                  ]
                }
              }
            }
          },
          401: { description: 'Token inválido' }
        }
      }
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Solicita recuperação de senha',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' }
                }
              }
            }
          }
        },
        responses: {
          202: { description: 'Solicitação aceita' }
        }
      }
    },
    '/auth/reset-password': {
      post: {
        summary: 'Atualiza a senha a partir de um token enviado por e-mail',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 6 }
                }
              }
            }
          }
        },
        responses: {
          204: { description: 'Senha redefinida' }
        }
      }
    }
  }
};

export { apiSpec };
