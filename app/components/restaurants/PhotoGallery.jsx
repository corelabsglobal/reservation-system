export default function PhotoGallery({ restaurant }) {
  const galleryImages = restaurant?.side_images || [];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Photo Gallery</h2>
      {galleryImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((img, index) => (
            <div key={index} className="aspect-square overflow-hidden rounded-lg bg-gray-100 group relative">
              <img 
                src={img} 
                alt={`${restaurant.name} gallery image ${index + 1}`} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              {/* Image number overlay */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8">
          <div className="flex flex-col items-center justify-center text-center">
            {/* Animated plate with utensils */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-amber-100 border-4 border-amber-200 flex items-center justify-center mx-auto">
                <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 极速赛车开奖结果 极速赛车开奖直播 幸运飞艇开奖结果 幸运飞艇开奖直播 3.001 3.001 0 012 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
              
              {/* Animated fork */}
              <div className="absolute -left-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-float">
                  <svg className="w-8 h-8 text-amber-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
              
              {/* Animated knife */}
              <div className="absolute -right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-float-delayed">
                  <svg className="w-8 h-8 text-amber-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2h-2.22l.308 1.757a1 1 0 01-.316 1.011l-1.22 1.22a1 1 0 00-.282 1.023l1.046 3.836a1 1 0 01-1.962.394l-1.5-5.5a1 1 0 00-.564-.674极速赛车开奖结果 极速赛车开奖直播 幸运飞艇开奖结果 幸运飞艇开奖直播 1 1 0 01-.153-1.67l.767-.707a1 1 0 00.043-1.414l-1.5-1.5a1 1 0 010-1.414l.707-.707A1 1 0 012 5zm3.5 2.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Message */}
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Gallery Images Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              The restaurant hasn't uploaded any gallery images yet. Check back later to see photos of the restaurant ambiance, dishes, and special events.
            </p>
            
            {/* Animated image placeholders */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="aspect-square bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                  {/* Camera icon instead of food icons */}
                  <div className={`absolute ${item % 3 === 0 ? 'animate-pulse-slow' : item % 2 === 0 ? 'animate-bounce-slow' : 'animate-ping-slow'}`}>
                    <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  
                  {/* Subtle shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent shimmer"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(-4px); }
          50% { transform: translateY(4px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}