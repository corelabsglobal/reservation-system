export default function LoadingAnimation() {
    return(
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black z-50 flex flex-col items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-amber-400/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border border-amber-400/10 transform rotate-45"></div>
          <div className="absolute top-1/3 right-1/3 w-16 h-16 border border-amber-400/10 rounded-lg"></div>
        </div>
        
        {/* Main spinner */}
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-amber-500"></div>
          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
            <div className="h-16 w-16 bg-amber-500/10 rounded-full animate-ping"></div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="mt-8 text-center">
          <p className="text-amber-400/80 font-light tracking-wider text-lg mb-2">LOADING EXPERIENCE</p>
          <p className="text-gray-400 text-sm">Preparing your exclusive dining journey</p>
        </div>
        
        {/* Subtle progress indicator */}
        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mt-8">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
            style={{
              width: '30%',
              animation: 'progressSlide 2s infinite ease-in-out',
            }}
          ></div>
        </div>
        
        {/* CSS for animations */}
        <style jsx>{`
          @keyframes progressSlide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>
    )
}