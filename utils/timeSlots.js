export function generateTimeSlots(startTime, endTime, durationMinutes) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  const isNextDay = endHour < startHour || (endHour === startHour && endMinute < startMinute);
  
  if (isNextDay) {
    while (currentHour < 24) {
      const formattedHour = currentHour.toString().padStart(2, '0');
      const formattedMinute = currentMinute.toString().padStart(2, '0');
      slots.push(`${formattedHour}:${formattedMinute}`);
      
      currentMinute += durationMinutes;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }
    
    currentHour = 0;
    currentMinute = 0;
  }
  
  while (
    (!isNextDay && (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute))) ||
    (isNextDay && (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)))
  ) {
    const formattedHour = currentHour.toString().padStart(2, '0');
    const formattedMinute = currentMinute.toString().padStart(2, '0');
    slots.push(`${formattedHour}:${formattedMinute}`);
    
    currentMinute += durationMinutes;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
    
    if (slots.length > 1440) break;
  }
  
  return slots;
}