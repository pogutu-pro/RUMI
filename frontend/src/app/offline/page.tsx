import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-full mb-6">
        <WifiOff className="w-12 h-12 text-zinc-400" />
      </div>
      <h1 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">
        You're Offline
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8">
        It looks like you've lost your internet connection. 
        Don't worry, you can still access pages you've visited previously.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium hover:opacity-90 transition-opacity"
      >
        Try Again
      </button>
    </div>
  );
}
