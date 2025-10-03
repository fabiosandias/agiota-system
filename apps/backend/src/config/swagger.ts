const apiSpec = {
  openapi: '3.0.1',
  info: {
    title: 'AITRON Financeira API - Multi-Tenant',
    version: '2.0.0',
    description:
      'Documentação completa da API da AITRON Financeira com suporte multi-tenant.\n\n' +
      '**Autenticação:**\n' +
      '- **Tenant (Clientes)**: Login via `/auth/login` - Acesso às rotas de negócio do tenant\n' +
      '- **Super Admin (AITRON)**: Login via `/admin/auth/login` - Gerenciamento de tenants e suporte\n\n' +
      '**Escopos:**\n' +
      '- `tenant`: Usuários dos clientes (roles: admin, operator, viewer)\n' +
      '- `system`: Super Admins da AITRON (acesso global)\n\n' +
      'Todas as rotas (exceto login) exigem token JWT no header `Authorization: Bearer <token>`'
  },
  servers: [{ url: '/api', description: 'API Base URL' }],
  tags: [
    { name: 'Auth (Tenant)', description: 'Autenticação de usuários tenant' },
    { name: 'Auth (Admin)', description: 'Autenticação de Super Admins' },
    { name: 'Tenants (Admin)', description: 'Gerenciamento de tenants - Super Admin apenas' },
    { name: 'Clients', description: 'Gerenciamento de clientes do tenant' },
    { name: 'Users', description: 'Gerenciamento de usuários do tenant' },
    { name: 'Accounts', description: 'Contas e transações' },
    { name: 'Loans', description: 'Empréstimos e parcelas' },
    { name: 'Utils', description: 'Utilitários (CEP, etc)' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtido via login (/auth/login ou /admin/auth/login)'
      }
    },
    schemas: {
      // Auth Schemas
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'usuario@exemplo.com' },
          password: { type: 'string', minLength: 6, example: 'senha123' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          refreshToken: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              phone: { type: 'string' },
              role: { type: 'string', enum: ['super_admin', 'admin', 'operator', 'viewer'] },
              avatar: { type: 'string', nullable: true }
            }
          }
        }
      },

      // Tenant Schemas
      Tenant: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Empresa Exemplo' },
          email: { type: 'string', format: 'email', example: 'contato@empresa.com' },
          cpfCnpj: { type: 'string', example: '12345678000190' },
          phone: { type: 'string', example: '11999998888' },
          addressId: { type: 'string', format: 'uuid', nullable: true },
          plan: { type: 'string', enum: ['free', 'pro'], example: 'pro' },
          status: { type: 'string', enum: ['active', 'past_due', 'suspended', 'canceled'], example: 'active' },
          trialStartAt: { type: 'string', format: 'date-time', nullable: true },
          trialEndAt: { type: 'string', format: 'date-time', nullable: true },
          nextDueAt: { type: 'string', format: 'date-time', nullable: true },
          billingMethod: { type: 'string', enum: ['pix', 'credit_card'], nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      TenantCreateInput: {
        type: 'object',
        required: ['name', 'email', 'adminFirstName', 'adminLastName', 'adminEmail', 'adminPassword'],
        properties: {
          name: { type: 'string', minLength: 2, example: 'Minha Empresa' },
          email: { type: 'string', format: 'email', example: 'contato@minhaempresa.com' },
          cpfCnpj: { type: 'string', example: '12345678000190' },
          phone: { type: 'string', example: '11999998888' },
          plan: { type: 'string', enum: ['free', 'pro'], default: 'free' },
          address: {
            type: 'object',
            properties: {
              postalCode: { type: 'string', example: '01310100' },
              street: { type: 'string', example: 'Av. Paulista' },
              number: { type: 'string', example: '1578' },
              district: { type: 'string', example: 'Bela Vista' },
              city: { type: 'string', example: 'São Paulo' },
              state: { type: 'string', minLength: 2, maxLength: 2, example: 'SP' },
              complement: { type: 'string', example: 'Sala 10' }
            }
          },
          adminFirstName: { type: 'string', example: 'João' },
          adminLastName: { type: 'string', example: 'Silva' },
          adminEmail: { type: 'string', format: 'email', example: 'joao@minhaempresa.com' },
          adminPassword: { type: 'string', minLength: 8, example: 'SenhaSegura@123' }
        }
      },
      TenantUpdateInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          cpfCnpj: { type: 'string' },
          phone: { type: 'string' },
          plan: { type: 'string', enum: ['free', 'pro'] },
          status: { type: 'string', enum: ['active', 'past_due', 'suspended', 'canceled'] },
          billingMethod: { type: 'string', enum: ['pix', 'credit_card'] },
          nextDueAt: { type: 'string', format: 'date-time' },
          address: { $ref: '#/components/schemas/AddressInput' }
        }
      },
      TenantListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Tenant' }
          },
          meta: { $ref: '#/components/schemas/PageInfo' }
        }
      },

      // Common Schemas
      AddressInput: {
        type: 'object',
        properties: {
          postalCode: { type: 'string', example: '01310100' },
          street: { type: 'string', example: 'Av. Paulista' },
          number: { type: 'string', example: '1578' },
          district: { type: 'string', example: 'Bela Vista' },
          city: { type: 'string', example: 'São Paulo' },
          state: { type: 'string', minLength: 2, maxLength: 2, example: 'SP' },
          complement: { type: 'string', example: 'Apto 101' }
        }
      },
      PageInfo: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 10 }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {}
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Erro ao processar requisição' },
          code: { type: 'string', example: 'VALIDATION_ERROR' }
        }
      }
    }
  },
  paths: {
    // ==================== AUTH TENANT ====================
    '/auth/login': {
      post: {
        tags: ['Auth (Tenant)'],
        summary: 'Login de usuários tenant',
        description: 'Autentica usuários do tenant (admin, operator, viewer) e retorna token JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
              example: {
                email: 'fabiowebmain@gmail.com',
                password: 'Admin@123'
              }
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
          401: { description: 'Credenciais inválidas' },
          500: { description: 'Erro interno' }
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth (Tenant)'],
        summary: 'Renovar token JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Token renovado' },
          401: { description: 'Refresh token inválido' }
        }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth (Tenant)'],
        summary: 'Logout',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Logout realizado' }
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Auth (Tenant)'],
        summary: 'Dados do usuário autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Perfil do usuário' },
          401: { description: 'Token inválido' }
        }
      }
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth (Tenant)'],
        summary: 'Solicitar recuperação de senha',
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
          202: { description: 'E-mail de recuperação enviado' }
        }
      }
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth (Tenant)'],
        summary: 'Redefinir senha com token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 8 }
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

    // ==================== AUTH ADMIN ====================
    '/admin/auth/login': {
      post: {
        tags: ['Auth (Admin)'],
        summary: 'Login Super Admin',
        description: 'Autentica Super Admins da AITRON (scope: system)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
              example: {
                email: 'fabio@aitron.com.br',
                password: 'SuperAdmin@123'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login Super Admin realizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          401: { description: 'Credenciais inválidas' },
          403: { description: 'Usuário não é Super Admin' }
        }
      }
    },
    '/admin/auth/refresh': {
      post: {
        tags: ['Auth (Admin)'],
        summary: 'Renovar token Super Admin',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Token renovado' },
          401: { description: 'Refresh token inválido' }
        }
      }
    },
    '/admin/auth/me': {
      get: {
        tags: ['Auth (Admin)'],
        summary: 'Dados do Super Admin autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Perfil do Super Admin' },
          401: { description: 'Token inválido' }
        }
      }
    },

    // ==================== TENANTS (ADMIN) ====================
    '/admin/tenants': {
      get: {
        tags: ['Tenants (Admin)'],
        summary: 'Listar todos os tenants',
        description: 'Retorna lista paginada de todos os tenants com filtros',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Busca por nome ou email' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'past_due', 'suspended', 'canceled'] } },
          { name: 'plan', in: 'query', schema: { type: 'string', enum: ['free', 'pro'] } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } }
        ],
        responses: {
          200: {
            description: 'Lista de tenants',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TenantListResponse' }
              }
            }
          },
          401: { description: 'Não autenticado' },
          403: { description: 'Apenas Super Admin' }
        }
      },
      post: {
        tags: ['Tenants (Admin)'],
        summary: 'Criar novo tenant',
        description: 'Cria um novo tenant com trial de 15 dias e usuário admin inicial',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TenantCreateInput' }
            }
          }
        },
        responses: {
          201: {
            description: 'Tenant criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    { properties: { data: { $ref: '#/components/schemas/Tenant' } } }
                  ]
                }
              }
            }
          },
          400: { description: 'Dados inválidos' },
          403: { description: 'Apenas Super Admin' },
          409: { description: 'Email já cadastrado' }
        }
      }
    },
    '/admin/tenants/{id}': {
      get: {
        tags: ['Tenants (Admin)'],
        summary: 'Buscar tenant por ID',
        description: 'Retorna detalhes completos do tenant incluindo contagem de usuários',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: {
            description: 'Tenant encontrado',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          allOf: [
                            { $ref: '#/components/schemas/Tenant' },
                            {
                              properties: {
                                _count: {
                                  type: 'object',
                                  properties: {
                                    users: { type: 'integer', example: 5 }
                                  }
                                }
                              }
                            }
                          ]
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          404: { description: 'Tenant não encontrado' },
          403: { description: 'Apenas Super Admin' }
        }
      },
      patch: {
        tags: ['Tenants (Admin)'],
        summary: 'Atualizar tenant',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TenantUpdateInput' }
            }
          }
        },
        responses: {
          200: { description: 'Tenant atualizado' },
          404: { description: 'Tenant não encontrado' },
          403: { description: 'Apenas Super Admin' }
        }
      },
      delete: {
        tags: ['Tenants (Admin)'],
        summary: 'Deletar tenant (soft delete)',
        description: 'Define status como "canceled" ao invés de deletar registro',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          204: { description: 'Tenant cancelado' },
          404: { description: 'Tenant não encontrado' },
          403: { description: 'Apenas Super Admin' }
        }
      }
    },

    // ==================== CLIENTS ====================
    '/v1/clients': {
      get: {
        tags: ['Clients'],
        summary: 'Listar clientes do tenant',
        description: 'Lista apenas clientes do tenant autenticado',
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
          200: { description: 'Lista de clientes' },
          403: { description: 'Conta suspensa' }
        }
      },
      post: {
        tags: ['Clients'],
        summary: 'Criar cliente',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'addresses'],
                properties: {
                  firstName: { type: 'string', example: 'João' },
                  lastName: { type: 'string', example: 'Silva' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string', example: '11999998888' },
                  document: { type: 'string', example: '12345678900' },
                  documentType: { type: 'string', enum: ['cpf', 'cnpj'] },
                  birthDate: { type: 'string', format: 'date' },
                  addresses: { type: 'array', items: { $ref: '#/components/schemas/AddressInput' } }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Cliente criado' },
          403: { description: 'Conta suspensa - sem permissão para criar' }
        }
      }
    },
    '/v1/clients/{id}': {
      get: {
        tags: ['Clients'],
        summary: 'Buscar cliente',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Cliente encontrado' },
          404: { description: 'Cliente não encontrado' }
        }
      },
      put: {
        tags: ['Clients'],
        summary: 'Atualizar cliente',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Cliente atualizado' },
          403: { description: 'Conta suspensa' }
        }
      },
      delete: {
        tags: ['Clients'],
        summary: 'Deletar cliente',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          204: { description: 'Cliente removido' },
          409: { description: 'Cliente tem empréstimos ativos' }
        }
      }
    },

    // ==================== USERS ====================
    '/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'Listar usuários do tenant',
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
        summary: 'Criar usuário (admin apenas)',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Usuário criado' }
        }
      }
    },
    '/v1/users/profile': {
      put: {
        tags: ['Users'],
        summary: 'Atualizar perfil próprio',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  avatar: { type: 'string', description: 'Base64 image' },
                  password: { type: 'string', minLength: 8 },
                  address: { $ref: '#/components/schemas/AddressInput' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Perfil atualizado' }
        }
      }
    },
    '/v1/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Buscar usuário',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Usuário encontrado' }
        }
      },
      put: {
        tags: ['Users'],
        summary: 'Atualizar usuário (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Usuário atualizado' }
        }
      },
      delete: {
        tags: ['Users'],
        summary: 'Deletar usuário (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          204: { description: 'Usuário removido' }
        }
      }
    },

    // ==================== ACCOUNTS ====================
    '/v1/accounts': {
      get: {
        tags: ['Accounts'],
        summary: 'Listar contas do tenant',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Lista de contas' }
        }
      }
    },
    '/v1/accounts/total-balance': {
      get: {
        tags: ['Accounts'],
        summary: 'Saldo total das contas',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Saldo total' }
        }
      }
    },
    '/accounts/{accountId}/deposit': {
      post: {
        tags: ['Accounts'],
        summary: 'Realizar depósito',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'accountId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
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
    },

    // ==================== LOANS ====================
    '/v1/loans': {
      get: {
        tags: ['Loans'],
        summary: 'Listar empréstimos do tenant',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'due_soon', 'overdue', 'paid', 'renegotiated', 'written_off'] } },
          { name: 'clientId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Lista de empréstimos' }
        }
      },
      post: {
        tags: ['Loans'],
        summary: 'Criar empréstimo',
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
                  principalAmount: { type: 'number', example: 1000 },
                  interestRate: { type: 'number', example: 5.5 },
                  dueDate: { type: 'string', format: 'date-time' },
                  installments: { type: 'integer', default: 1, example: 12 },
                  notes: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Empréstimo criado' },
          400: { description: 'Saldo insuficiente' },
          403: { description: 'Conta suspensa' }
        }
      }
    },
    '/v1/loans/{id}': {
      get: {
        tags: ['Loans'],
        summary: 'Buscar empréstimo',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Empréstimo encontrado' },
          404: { description: 'Empréstimo não encontrado' }
        }
      },
      put: {
        tags: ['Loans'],
        summary: 'Atualizar empréstimo',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Empréstimo atualizado' }
        }
      },
      delete: {
        tags: ['Loans'],
        summary: 'Deletar empréstimo',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          204: { description: 'Empréstimo removido' },
          409: { description: 'Empréstimo tem pagamentos' }
        }
      }
    },

    // ==================== UTILS ====================
    '/v1/postal-codes/{cep}': {
      get: {
        tags: ['Utils'],
        summary: 'Buscar CEP (ViaCEP)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'cep', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9]{8}$' } }
        ],
        responses: {
          200: { description: 'Endereço encontrado' },
          404: { description: 'CEP não encontrado' }
        }
      }
    }
  }
};

export { apiSpec };
