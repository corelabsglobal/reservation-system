'use client';

export default function RestaurantHeader({ restaurant }) {
  return (
    <>
      <div className="md:w-1/2">
        <img
          src={restaurant.restaurant_image || "/images/golden-lounge.jpeg"}
          alt={restaurant.name}
          className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] object-cover rounded-lg shadow-lg"
        />
      </div>
    </>
  );
}