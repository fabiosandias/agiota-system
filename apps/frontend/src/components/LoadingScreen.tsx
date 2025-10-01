interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = 'Carregando...' }: LoadingScreenProps) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="flex flex-col items-center gap-4 rounded-xl bg-white/80 px-10 py-8 shadow-xl backdrop-blur dark:bg-slate-900/80">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" aria-hidden />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-200">{message}</p>
    </div>
  </div>
);

export default LoadingScreen;
