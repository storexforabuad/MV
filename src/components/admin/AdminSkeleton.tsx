interface AdminSkeletonProps {
  contentOnly?: boolean;
}

const AdminSkeleton = ({ contentOnly = false }: AdminSkeletonProps) => {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-zinc-900 ${contentOnly ? '' : 'pb-20'}`}>
      {/* Header */}
      {!contentOnly && (
        <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="h-6 w-32 bg-gray-200 dark:bg-zinc-800 rounded-md animate-pulse" />
            <div className="flex items-center space-x-4">
              <div className="h-6 w-6 bg-gray-200 dark:bg-zinc-800 rounded-full animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-zinc-800 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Back to Store Button Skeleton */}
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-4 px-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden animate-pulse">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-zinc-800" />
          </div>
          <div className="flex flex-col items-start min-w-0 space-y-2">
            <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-3 w-40 bg-gray-200 dark:bg-zinc-800 rounded-md" />
          </div>
          <div className="ml-auto flex items-center flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-zinc-800" />
          </div>
        </div>

        {/* Refresh Button Skeleton */}
        <div className="w-full h-[52px] bg-gray-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="relative min-h-[140px] rounded-[2rem] bg-gray-200 dark:bg-zinc-800 animate-pulse overflow-hidden flex flex-col items-center justify-center gap-3 p-4 sm:p-5 shadow-md w-full h-full"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 dark:bg-black/20" />
              <div className="h-8 w-16 bg-white/20 dark:bg-black/20 rounded-md" />
              <div className="h-4 w-20 bg-white/20 dark:bg-black/20 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation Skeleton */}
      {!contentOnly && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0))' }}
        >
          <div className="relative w-full h-20">
            {/* Background bar */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-xl border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-md mx-4 animate-pulse" />

            {/* Navigation content: left / center spacer / right to perfectly center side icons around the floating + */}
            <div className="absolute bottom-0 left-0 right-0 h-20 flex items-center px-4">
              <div className="flex-1 flex justify-center items-center">
                <div className="flex flex-col items-center justify-center h-14 w-14 rounded-lg space-y-1 mt-1">
                  <div className="h-6 w-6 bg-gray-300 dark:bg-zinc-600 rounded-md animate-pulse" />
                  <div className="h-2 w-10 bg-gray-300 dark:bg-zinc-600 rounded-md animate-pulse mt-1" />
                </div>
              </div>

              {/* Right side - Activity button */}
              <div className="flex-1 flex justify-center items-center">
                <div className="flex flex-col items-center justify-center h-14 w-14 rounded-lg space-y-1 mt-1">
                  <div className="h-6 w-6 bg-gray-300 dark:bg-zinc-600 rounded-md animate-pulse" />
                  <div className="h-2 w-10 bg-gray-300 dark:bg-zinc-600 rounded-md animate-pulse mt-1" />
                </div>
              </div>
            </div>

            {/* Centered + button */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
              <div className="w-16 h-16 bg-gray-300 dark:bg-zinc-600 rounded-full shadow-lg animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSkeleton;
