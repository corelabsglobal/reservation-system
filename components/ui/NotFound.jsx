export default function NotFound() {
    return(
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden relative">
            {/* Animated background elements */}
            <div className="absolute inset-0 bg-[url('/images/background.jpeg')] bg-cover bg-center opacity-20"></div>
            
            {/* Subtle geometric elements */}
            <div className="absolute top-20 left-10 w-20 h-20 border border-amber-400/10 rounded-full"></div>
            <div className="absolute bottom-20 right-10 w-16 h-16 border border-amber-400/10 transform rotate-45"></div>
            
            <div className="flex flex-col items-center justify-center min-h-screen relative z-10 px-6">
            {/* Main icon */}
            <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center shadow-2xl shadow-black/50 border border-amber-400/20">
                <svg 
                    className="w-16 h-16 text-amber-400/70" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5"
                >
                    <path d="M9.172 18.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                </div>
                <div className="absolute -ins-2 bg-amber-400/5 rounded-full blur-md"></div>
            </div>
            
            {/* Main message */}
            <h1 className="text-4xl font-light text-center mb-4 tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-500">
                Culinary Destination Not Found
            </h1>
            
            <p className="text-gray-400 text-lg text-center max-w-md mb-10 leading-relaxed">
                We couldn't locate the exquisite dining experience you're seeking. 
                It may have been removed or is temporarily unavailable.
            </p>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 flex items-center"
                >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Return to Destinations
                </button>
                
                <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white rounded-lg transition-all duration-300 flex items-center"
                >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Explore Alternatives
                </button>
            </div>
            
            {/* Additional guidance */}
            <div className="mt-12 p-6 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700 max-w-md">
                <h3 className="text-amber-400 font-medium mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Suggestions
                </h3>
                <ul className="text-gray-400 text-sm space-y-2">
                <li className="flex items-start">
                    <span className="text-amber-400 mr-2">•</span> 
                    Verify the restaurant name or try a different search term
                </li>
                <li className="flex items-start">
                    <span className="text-amber-400 mr-2">•</span> 
                    Browse our curated collection of premium establishments
                </li>
                <li className="flex items-start">
                    <span className="text-amber-400 mr-2">•</span> 
                    Contact our concierge for personalized assistance
                </li>
                </ul>
            </div>
            </div>
        </div>
    )
}