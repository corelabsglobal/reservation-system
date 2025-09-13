'use client';

import { useState, useEffect } from 'react';

const Reviews = () => {
  const [displayedReviews, setDisplayedReviews] = useState([]);

  const allReviews = [
    {
      id: 1,
      name: "John Doe",
      initials: "JD",
      rating: 5,
      comment: "The food was absolutely incredible! The atmosphere was perfect for our anniversary dinner. Will definitely be coming back soon."
    },
    {
      id: 2,
      name: "Alice Smith",
      initials: "AS",
      rating: 5,
      comment: "Excellent service and the wine selection was impressive. The staff went above and beyond to make our evening special."
    },
    {
      id: 3,
      name: "Michael Brown",
      initials: "MB",
      rating: 4,
      comment: "Great food and good service. The dessert menu could use more options, but overall a wonderful experience."
    },
    {
      id: 4,
      name: "Sarah Johnson",
      initials: "SJ",
      rating: 5,
      comment: "Absolutely phenomenal! Every dish was a masterpiece. The chef's special was particularly outstanding."
    },
    {
      id: 5,
      name: "David Wilson",
      initials: "DW",
      rating: 4,
      comment: "Cozy atmosphere and friendly staff. The portions were generous and the prices were reasonable for the quality."
    },
    {
      id: 6,
      name: "Emily Davis",
      initials: "ED",
      rating: 5,
      comment: "Perfect date night spot! Romantic ambiance, exceptional service, and the cocktails were creative and delicious."
    },
    {
      id: 7,
      name: "Robert Taylor",
      initials: "RT",
      rating: 4,
      comment: "Solid restaurant with consistent quality. The lunch specials are a great value. Highly recommend the pasta dishes."
    },
    {
      id: 8,
      name: "Jennifer Lee",
      initials: "JL",
      rating: 5,
      comment: "Best restaurant in town! The flavors were incredible and the presentation was beautiful. Will be back soon!"
    }
  ];

  useEffect(() => {
    // Randomly select 2 reviews
    const shuffled = [...allReviews].sort(() => 0.5 - Math.random());
    setDisplayedReviews(shuffled.slice(0, 2));
  }, []);

  const StarRating = ({ rating }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 ${star <= rating ? 'text-amber-400' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
      <div className="flex items-center mb-6">
        <div className="flex items-center mr-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-amber-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-gray-600">4.8 based on {allReviews.length} reviews</span>
      </div>

      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
            <div className="flex items-center mb-2">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <span className="text-gray-600 font-medium">{review.initials}</span>
              </div>
              <div>
                <h4 className="font-semibold">{review.name}</h4>
                <StarRating rating={review.rating} />
              </div>
            </div>
            <p className="text-gray-600 text-sm">{review.comment}</p>
          </div>
        ))}
      </div>

      <button className="mt-6 w-full py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
        View All Reviews
      </button>
    </div>
  );
};

export default Reviews;