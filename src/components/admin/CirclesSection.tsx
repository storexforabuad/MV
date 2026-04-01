import { CircleStackIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface CirclesSectionProps {
  isCirclesOpen: boolean;
  setIsCirclesOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CirclesSection: React.FC<CirclesSectionProps> = ({ 
  isCirclesOpen, 
  setIsCirclesOpen 
}) => {
  return (
    <section className="mb-8 bg-card-background p-4 sm:p-6 rounded-xl shadow-[var(--shadow-sm)] transition-all">
      <div 
        className="flex justify-between items-center cursor-pointer bg-card-hover p-4 rounded-lg hover:bg-opacity-80 transition-colors" 
        onClick={() => setIsCirclesOpen(!isCirclesOpen)}
      >
        <div className="flex items-center gap-2">
          <CircleStackIcon className="w-5 h-5 text-text-primary" />
          <h2 className="text-xl font-semibold text-text-primary">Circles</h2>
        </div>
        <div className="text-text-primary">
          {isCirclesOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
        </div>
      </div>
      
      {isCirclesOpen && (
        <div className="mt-6 text-center p-4 sm:p-8">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]">
            <span className="text-sm font-medium">Coming Soon!</span>
          </div>
        </div>
      )}

      <div className="mt-6 px-2 sm:px-8">
        <p className="text-sm sm:text-base text-text-secondary text-left sm:text-center">
          Get ready for Circles - our groundbreaking advertising platform that will transform how you connect with customers. 
          Create targeted ad campaigns, reach wider audiences, and boost your sales like never before!
        </p>
        
        <div className="mt-4 sm:mt-6 space-y-4">
          <div className="bg-card-hover rounded-lg p-4">
            <h3 className="font-medium text-text-primary text-sm sm:text-base mb-3">
              🎯 Key Features Coming Soon
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-text-secondary">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Targeted advertising campaigns</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Advanced audience analytics</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Custom ad performance tracking</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Smart budget optimization</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Real-time campaign insights</span>
              </li>
            </ul>
          </div>

          <div className="bg-card-hover rounded-lg p-4">
            <div className="text-xs sm:text-sm text-text-secondary flex items-center justify-center gap-2">
              <span>🚀</span>
              <span>Be among the first to experience the future of digital advertising</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CirclesSection;
