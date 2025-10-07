"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { X, Star } from "lucide-react";

export const RatingModal = ({ reservation, restaurant, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        reservationId: reservation.id,
        restaurantId: restaurant.id,
        rating,
        review: review.trim() || null
      });
      onClose();
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md relative"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">
            Rate Your Experience
          </h2>
          <p className="text-gray-300">
            How was your visit to {restaurant.name}?
          </p>
        </div>

        <div className="flex justify-center mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className="mx-1 focus:outline-none"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              <Star
                size={32}
                className={
                  (hoverRating || rating) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-500"
                }
              />
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Your Review (Optional)</label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            rows={3}
            placeholder="Share your thoughts about the experience..."
          />
        </div>

        <Button
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 transition-all"
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Rating"}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export const usePreviousDayReservationCheck = () => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reservationToRate, setReservationToRate] = useState(null);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    const checkForPreviousDayReservation = async () => {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get yesterday's date in YYYY-MM-DD format
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayFormatted = yesterday.toISOString().split('T')[0];

        // Check if there's a reservation from yesterday that was attended
        const { data: reservations, error: reservationError } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', yesterdayFormatted)
          .eq('attended', true);

        if (reservationError) throw reservationError;
        if (!reservations || reservations.length === 0) return;

        // Check if reviews already exist for these reservations
        const { data: existingReviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('reservation_id')
          .in('reservation_id', reservations.map(r => r.id));

        if (reviewsError) throw reviewsError;

        const { data: shownPrompts, error: promptError } = await supabase
          .from('shown_rating_prompts')
          .select('reservation_id')
          .in('reservation_id', reservations.map(r => r.id))
          .eq('user_id', user.id);

        if (promptError) throw promptError;

        // Filter out reservations that already have reviews or had prompts shown
        const unreviewedReservations = reservations.filter(
          r => !existingReviews?.some(review => review.reservation_id === r.id) &&
               !shownPrompts?.some(prompt => prompt.reservation_id === r.id)
        );

        if (unreviewedReservations.length === 0) return;

        // Get the restaurant details for the first unreviewed reservation
        const reservation = unreviewedReservations[0];
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', reservation.restaurant_id)
          .single();

        if (restaurantError) throw restaurantError;

        // Mark that we're showing this prompt
        await supabase
          .from('shown_rating_prompts')
          .insert([{ user_id: user.id, reservation_id: reservation.id }]);

        setReservationToRate(reservation);
        setRestaurant(restaurantData);
        setShowReviewModal(true);
      } catch (error) {
        console.error("Error checking for previous day reservations:", error);
      }
    };

    checkForPreviousDayReservation();
  }, []);

  const handleSubmitReview = async (reviewData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('reviews')
        .insert([{
          reservation_id: reviewData.reservationId,
          restaurant_id: reviewData.restaurantId,
          user_id: user.id,
          rating: reviewData.rating,
          title: reviewData.title,
          review_text: reviewData.reviewText,
          food_quality: reviewData.foodQuality,
          service_quality: reviewData.serviceQuality,
          ambiance: reviewData.ambiance,
          value_for_money: reviewData.valueForMoney,
          would_recommend: reviewData.wouldRecommend
        }]);

      if (error) throw error;
    } catch (error) {
      console.error("Error submitting review:", error);
      throw error;
    }
  };

  return {
    showReviewModal,
    reservationToRate,
    restaurant,
    onClose: () => setShowReviewModal(false),
    onSubmitReview: handleSubmitReview
  };
};