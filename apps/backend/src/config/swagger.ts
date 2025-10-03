const apiSpec = {
  openapi: '3.0.1',
  info: {
    title: 'AITRON Financeira API',
    version: '1.0.0',
    description:
      'Documentação da API da AITRON Financeira. Todas as rotas (exceto autenticação e saúde) exigem o envio do token JWT no header Authorization.'
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
        tags: ['Auth'],
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
        tags: ['Auth'],
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
    },
    '/v1/clients': {
      get: {
        tags: ['Clients'],
        summary: 'Lista todos os clientes com paginação e filtros',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'name', in: 'query', schema: { type: 'string' } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'district', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Lista de clientes retornada' }
        }
      },
      post: {
        tags: ['Clients'],
        summary: 'Cria um novo cliente',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'addresses'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  document: { type: 'string' },
                  documentType: { type: 'string', enum: ['cpf', 'cnpj'] },
                  birthDate: { type: 'string', format: 'date' },
                  addresses: { type: 'array', items: { type: 'object' } }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Cliente criado' }
        }
      }
    },
    '/v1/clients/{id}': {
      get: {
        tags: ['Clients'],
        summary: 'Busca um cliente por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Cliente encontrado' },
          404: { description: 'Cliente não encontrado' }
        }
      },
      put: {
        tags: ['Clients'],
        summary: 'Atualiza um cliente',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Cliente atualizado' }
        }
      },
      delete: {
        tags: ['Clients'],
        summary: 'Remove um cliente',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          204: { description: 'Cliente removido' }
        }
      }
    },
    '/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'Lista todos os usuários (apenas admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Lista de usuários' }
        }
      },
      post: {
        tags: ['Users'],
        summary: 'Cria novo usuário (apenas admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Usuário criado' }
        }
      }
    },
    '/v1/users/profile': {
      put: {
        tags: ['Users'],
        summary: 'Atualiza perfil do usuário autenticado',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string', example: 'João' },
                  lastName: { type: 'string', example: 'Silva' },
                  email: { type: 'string', format: 'email', example: 'joao@example.com' },
                  phone: { type: 'string', example: '11999999999' },
                  avatar: { type: 'string', description: 'Imagem em base64 (opcional)' },
                  password: { type: 'string', minLength: 8, description: 'Nova senha (opcional)' },
                  address: {
                    type: 'object',
                    properties: {
                      postalCode: { type: 'string', example: '01310100' },
                      street: { type: 'string', example: 'Avenida Paulista' },
                      number: { type: 'string', example: '1578' },
                      district: { type: 'string', example: 'Bela Vista' },
                      city: { type: 'string', example: 'São Paulo' },
                      state: { type: 'string', example: 'SP' },
                      complement: { type: 'string', example: 'Apto 101' }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Perfil atualizado com sucesso' },
          401: { description: 'Não autenticado' },
          500: { description: 'Erro ao atualizar perfil' }
        }
      }
    },
    '/v1/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Busca usuário por ID (apenas admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Usuário encontrado' }
        }
      },
      put: {
        tags: ['Users'],
        summary: 'Atualiza usuário (apenas admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Usuário atualizado' }
        }
      },
      delete: {
        tags: ['Users'],
        summary: 'Remove usuário (apenas admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          204: { description: 'Usuário removido' }
        }
      }
    },
    '/v1/accounts': {
      get: {
        tags: ['Accounts'],
        summary: 'Lista todas as contas',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Lista de contas' }
        }
      }
    },
    '/v1/accounts/total-balance': {
      get: {
        tags: ['Accounts'],
        summary: 'Retorna saldo total de todas as contas',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Saldo total' }
        }
      }
    },
    '/v1/loans': {
      get: {
        tags: ['Loans'],
        summary: 'Lista todos os empréstimos',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'due_soon', 'overdue', 'paid', 'defaulted'] } }
        ],
        responses: {
          200: { description: 'Lista de empréstimos' }
        }
      },
      post: {
        tags: ['Loans'],
        summary: 'Cria novo empréstimo',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['clientId', 'accountId', 'principalAmount', 'interestRate', 'dueDate'],
                properties: {
                  clientId: { type: 'string', format: 'uuid' },
                  accountId: { type: 'string', format: 'uuid' },
                  principalAmount: { type: 'number' },
                  interestRate: { type: 'number' },
                  dueDate: { type: 'string', format: 'date-time' },
                  installments: { type: 'integer', default: 1 },
                  notes: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Empréstimo criado' }
        }
      }
    },
    '/v1/loans/{id}': {
      get: {
        tags: ['Loans'],
        summary: 'Busca empréstimo por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Empréstimo encontrado' }
        }
      },
      put: {
        tags: ['Loans'],
        summary: 'Atualiza empréstimo',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Empréstimo atualizado' }
        }
      },
      delete: {
        tags: ['Loans'],
        summary: 'Remove empréstimo',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          204: { description: 'Empréstimo removido' }
        }
      }
    },
    '/v1/postal-codes/{cep}': {
      get: {
        tags: ['Utils'],
        summary: 'Busca endereço pelo CEP via ViaCEP',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'cep', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9]{8}$' } }],
        responses: {
          200: { description: 'Endereço encontrado' },
          404: { description: 'CEP não encontrado' }
        }
      }
    },
    '/accounts/{accountId}/deposit': {
      post: {
        tags: ['Accounts'],
        summary: 'Realiza depósito em uma conta',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'accountId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: {
                  amount: { type: 'number', minimum: 0.01 },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Depósito realizado' }
        }
      }
    }
  }
};

export { apiSpec };
