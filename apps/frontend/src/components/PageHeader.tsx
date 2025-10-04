import { useNavigate, useLocation, Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  backTo?: string;
}

const PageHeader = ({ title, showBackButton = true, backTo }: PageHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  // Gerar breadcrumbs baseado no path atual
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);

    const breadcrumbMap: Record<string, string> = {
      '': 'Dashboard',
      'clients': 'Clientes',
      'loans': 'Empréstimos',
      'transactions': 'Transações',
      'accounts': 'Contas',
      'users': 'Usuários',
      'settings': 'Configurações',
      'profile': 'Perfil',
      'subscription': 'Assinatura',
      'admin': 'Administração',
      'new': 'Novo',
      'deposit': 'Depósito'
    };

    const breadcrumbs = [
      { label: 'Início', path: '/' }
    ];

    let currentPath = '';
    paths.forEach((segment, index) => {
      currentPath += `/${segment}`;
      // Ignorar IDs (UUIDs ou números)
      if (/^[0-9a-f-]{36}$|^\d+$/.test(segment)) {
        return;
      }
      breadcrumbs.push({
        label: breadcrumbMap[segment] || segment,
        path: currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="mb-6">
      {/* Título com botão voltar */}
      <div className="flex items-center gap-3 mb-2">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            aria-label="Voltar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-3xl">
          {title}
        </h1>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 ml-0">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center gap-2">
            {index > 0 && (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-slate-700 dark:text-slate-300">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PageHeader;
