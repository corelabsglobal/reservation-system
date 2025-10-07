'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

const Reviews = ({ restaurantId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [displayedReviews, setDisplayedReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Fetch reviews without joining profiles table
        const { data: reviewsData, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('Fetched reviews:', reviewsData); // Debug log

        setReviews(reviewsData || []);

        // Calculate average rating
        if (reviewsData && reviewsData.length > 0) {
          const avg = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
          setAverageRating(avg);
          
          // Display 2 random reviews
          const shuffled = [...reviewsData].sort(() => 0.5 - Math.random());
          setDisplayedReviews(shuffled.slice(0, 2));
        } else {
          setDisplayedReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchReviews();
    }
  }, [restaurantId]);

  const StarRating = ({ rating }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = (review) => {
    // Since we don't have profiles table, we'll use a generic name
    // You can modify this based on what data you have
    return 'Guest User';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="flex items-center mb-6">
            <div className="flex space-x-1 mr-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-5 w-5 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center mb-2">
                  <div className="h-10 w-10 rounded-full bg-gray-200 mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map(j => (
                        <div key={j} className="h-3 w-3 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mt-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
      
      <AnimatePresence mode="wait">
        {reviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </motion.div>
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-semibold text-gray-600 mb-2"
            >
              No Reviews Yet
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-500 mb-6"
            >
              Be the first to share your experience at this restaurant!
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="w-12 h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto rounded-full"
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center mb-6">
              <div className="flex items-center mr-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 ${star <= Math.round(averageRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-600">
                {averageRating.toFixed(1)} based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {displayedReviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-gray-100 pb-4 last:border-0"
                  >
                    <div className="flex items-center mb-2">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mr-3">
                        <span className="text-white font-medium text-sm">
                          {getInitials(getUserDisplayName(review))}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {getUserDisplayName(review)}
                        </h4>
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    {review.title && (
                      <h5 className="font-medium text-gray-800 mb-1">
                        {review.title}
                      </h5>
                    )}
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {review.review_text || 'No review text provided.'}
                    </p>
                    
                    {/* Additional Review Details */}
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                      {review.food_quality && (
                        <div className="flex items-center">
                          <span className="mr-1">🍽️</span>
                          Food: {review.food_quality}/5
                        </div>
                      )}
                      {review.service_quality && (
                        <div className="flex items-center">
                          <span className="mr-1">💁</span>
                          Service: {review.service_quality}/5
                        </div>
                      )}
                      {review.would_recommend !== null && (
                        <div className={`flex items-center ${review.would_recommend ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="mr-1">
                            {review.would_recommend ? '👍' : '👎'}
                          </span>
                          {review.would_recommend ? 'Recommends' : "Doesn't recommend"}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {reviews.length > 2 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 w-full py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => {
                  console.log('View all reviews clicked');
                }}
              >
                View All {reviews.length} Reviews
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reviews;