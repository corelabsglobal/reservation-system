import { useState, useEffect } from 'react';

export default function HeroCarousel({ restaurant }) {
  const allImages = [
    restaurant?.restaurant_image,
    ...(restaurant?.side_images || [])
  ].filter(img => img);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle case where there are no images
  if (allImages.length === 0) {
    return (
      <div className="relative h-[500px] w-full overflow-hidden bg-gray-800">
        <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
          <div className="text-white text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p>No images available</p>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30"></div>
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            {restaurant?.name || "Restaurant Name"}
          </h1>
          <div className="flex items-center text-white/90">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 极速赛车开奖结果 极速赛车开奖直播 幸运飞艇开奖结果 幸运飞艇开奖直播 0 3 3 0 016 0z"
              />
            </svg>
            <span className="truncate max-w-xs sm:max-w-sm md:max-w-md">
              {restaurant?.address || restaurant?.location || "Location not specified"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Function to go to next image with smooth transition
  const nextImage = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => 
      prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
    );
    
    // Reset transitioning state after animation completes
    setTimeout(() => setIsTransitioning(false), 700);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? allImages.length - 1 : prevIndex - 1
    );
    
    setTimeout(() => setIsTransitioning(false), 700);
  };

  useEffect(() => {
    if (allImages.length <= 1) return; // Don't auto-advance if only one image
    
    const interval = setInterval(() => {
      nextImage();
    }, 5000); // Change image every 5 seconds
    
    return () => clearInterval(interval);
  }, [allImages.length]);

  return (
    <div className="relative h-[500px] w-full overflow-hidden">
      {/* Image container with sliding animation */}
      <div 
        className="absolute inset-0 flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {allImages.map((image, index) => (
          <div 
            key={index}
            className="min-w-full h-full relative"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation arrows (only show if multiple images) */}
      {allImages.length > 1 && (
        <>
          <button 
            onClick={prevImage}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 md:p-3 rounded-full transition-all duration-300"
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={nextImage}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 md:p-3 rounded-full transition-all duration-300"
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      
      {/* Indicator dots (only show if multiple images) */}
      {allImages.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
          {allImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Restaurant info */}
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-10">
        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3">
          {restaurant?.name || "Restaurant Name"}
        </h1>
        <div className="flex items-center text-white/90 text-base md:text-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 md:h-6 md:w-6 mr-2 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
            {restaurant?.address || restaurant?.location || "Location not specified"}
          </span>
        </div>
      </div>
    </div>
  );
}