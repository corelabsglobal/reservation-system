"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Star, ThumbsUp, ThumbsDown } from "lucide-react";

export const ReviewModal = ({ reservation, restaurant, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [foodQuality, setFoodQuality] = useState(0);
  const [serviceQuality, setServiceQuality] = useState(0);
  const [ambiance, setAmbiance] = useState(0);
  const [valueForMoney, setValueForMoney] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please provide an overall rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        reservationId: reservation.id,
        restaurantId: restaurant.id,
        rating,
        title: title.trim() || null,
        reviewText: reviewText.trim() || null,
        foodQuality: foodQuality || null,
        serviceQuality: serviceQuality || null,
        ambiance: ambiance || null,
        valueForMoney: valueForMoney || null,
        wouldRecommend
      };
      
      await onSubmit(reviewData);
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingSection = ({ label, value, onChange }) => (
    <div className="mb-6">
      <label className="block text-gray-300 mb-3 text-sm font-medium text-center">
        {label}
      </label>
      <div className="flex justify-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className="focus:outline-none transform hover:scale-110 transition-transform"
            onClick={() => onChange(star)}
          >
            <Star
              size={28}
              className={
                value >= star
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-500 hover:text-yellow-300"
              }
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 relative mb-6">
          <button
            onClick={onClose}
            className="absolute top-0 right-0 text-gray-400 hover:text-white transition-colors z-10"
          >
            <X size={24} />
          </button>

          <div className="text-center pr-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">
              Share Your Experience
            </h2>
            <p className="text-gray-300">
              How was your visit to {restaurant.name}?
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {/* Overall Rating */}
          <div className="mb-8 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              Overall Rating *
            </h3>
            <div className="flex justify-center space-x-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="focus:outline-none transform hover:scale-125 transition-transform"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    size={44}
                    className={
                      (hoverRating || rating) >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-500 hover:text-yellow-300"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Ratings - Vertical Layout */}
          <div className="space-y-6 mb-8">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                Rate Your Experience
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                How would you rate these aspects?
              </p>
            </div>
            
            <div className="space-y-6">
              <RatingSection
                label="Food Quality"
                value={foodQuality}
                onChange={setFoodQuality}
              />
              <RatingSection
                label="Service Quality"
                value={serviceQuality}
                onChange={setServiceQuality}
              />
              {/*<RatingSection
                label="Ambiance"
                value={ambiance}
                onChange={setAmbiance}
              />
              <RatingSection
                label="Value for Money"
                value={valueForMoney}
                onChange={setValueForMoney}
              />*/}
            </div>
          </div>

          {/* Recommendation */}
          <div className="mb-8">
            <label className="block text-gray-300 mb-4 text-sm font-medium text-center">
              Would you recommend this restaurant?
            </label>
            <div className="flex justify-center space-x-6">
              <button
                onClick={() => setWouldRecommend(true)}
                className={`flex items-center px-6 py-3 rounded-lg transition-all ${
                  wouldRecommend === true
                    ? "bg-green-600 text-white shadow-lg"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                }`}
              >
                <ThumbsUp size={20} className="mr-2" />
                Yes
              </button>
              <button
                onClick={() => setWouldRecommend(false)}
                className={`flex items-center px-6 py-3 rounded-lg transition-all ${
                  wouldRecommend === false
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                }`}
              >
                <ThumbsDown size={20} className="mr-2" />
                No
              </button>
            </div>
          </div>

          {/* Review Title */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-3 text-sm font-medium">
              Review Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Summarize your experience..."
              maxLength={100}
            />
          </div>

          {/* Review Text */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-3 text-sm font-medium">
              Detailed Review (Optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Share your detailed thoughts about the food, service, ambiance, and overall experience..."
              maxLength={1000}
            />
            <div className="text-right text-sm text-gray-400 mt-2">
              {reviewText.length}/1000 characters
            </div>
          </div>
        </div>

        {/* Fixed Footer with Submit Button */}
        <div className="flex-shrink-0 pt-4 mt-2 border-t border-gray-700">
          <Button
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 transition-all text-white font-semibold py-3"
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? "Submitting Review..." : "Submit Review"}
          </Button>
        </div>
      </motion.div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6B7280;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
        
        /* Hide scrollbar for tablets and desktops */
        @media (min-width: 768px) {
          .custom-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .custom-scrollbar::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </motion.div>
  );
};