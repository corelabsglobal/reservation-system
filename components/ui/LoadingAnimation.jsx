export default function LoadingAnimation() {
    return(
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[url('/images/background.jpeg')] bg-cover bg-center opacity-20"></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
            {[...Array(15)].map((_, i) => (
            <div
                key={i}
                className="absolute w-2 h-2 bg-amber-400 rounded-full opacity-70"
                style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `floatParticle 3s infinite ease-in-out ${i * 0.2}s`,
                }}
            ></div>
            ))}
        </div>
        
        {/* Geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-amber-400/30 rounded-lg transform rotate-45 animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border-2 border-amber-400/20 rounded-full animate-ping"></div>
        
        <div className="flex flex-col items-center justify-center min-h-screen relative z-10">
            {/* Logo/Icon */}
            <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/30">
                <svg 
                className="w-12 h-12 text-white" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                >
                <path d="M8 12h8M12 8v8M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                </svg>
            </div>
            <div className="absolute -inset-2 bg-amber-400/20 rounded-full blur-lg animate-pulse"></div>
            </div>
            
            {/* Animated text */}
            <div className="text-center mb-12">
            <h2 className="text-3xl font-light mb-2 tracking-wider">CURATING EXCLUSIVE EXPERIENCES</h2>
            <div className="flex justify-center items-center space-x-2">
                <div className="h-6 w-6 border-t-2 border-r-2 border-amber-400 rounded-full animate-spin"></div>
                <p className="text-amber-300/80 font-light tracking-widest text-sm">LOADING LUXURY DESTINATIONS</p>
            </div>
            </div>
            
            {/* Progress indicator */}
            <div className="w-80 h-1 bg-gray-700 rounded-full overflow-hidden mb-8">
            <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                style={{
                width: '30%',
                animation: 'progressBar 2s infinite ease-in-out',
                }}
            ></div>
            </div>
            
            {/* Subtle tagline */}
            <p className="text-gray-400 text-sm font-light tracking-widest italic">
            RESERVED FOR THE DISCERNING FEW
            </p>
        </div>
        
        {/* CSS for animations */}
        <style jsx>{`
            @keyframes floatParticle {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0.7; }
            50% { transform: translateY(-20px) translateX(10px); opacity: 0.3; }
            }
            @keyframes progressBar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
            }
        `}</style>
        </div>
    )
}