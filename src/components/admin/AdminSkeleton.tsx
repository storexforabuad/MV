const AdminSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="h-6 w-32 bg-gray-200 dark:bg-slate-800 rounded-md animate-pulse" />
          <div className="flex items-center space-x-4">
            <div className="h-6 w-6 bg-gray-200 dark:bg-slate-800 rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-slate-800 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Refresh Button Skeleton */}
        <div className="w-full h-12 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              className="relative aspect-[1.4/1] rounded-2xl bg-gray-200 dark:bg-slate-800 animate-pulse overflow-hidden"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 p-4">
                {/* Icon Circle */}
                <div className="w-10 h-10 rounded-full bg-white/20 dark:bg-black/20" />
                {/* Text Lines */}
                <div className="h-4 w-16 bg-white/20 dark:bg-black/20 rounded-md" />
                <div className="h-3 w-10 bg-white/20 dark:bg-black/20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 md:hidden z-50">
        <div className="grid grid-cols-4 h-full">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex flex-col items-center justify-center space-y-1">
              <div className="h-6 w-6 bg-gray-200 dark:bg-slate-800 rounded-md animate-pulse" />
              <div className="h-2 w-8 bg-gray-200 dark:bg-slate-800 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSkeleton;
