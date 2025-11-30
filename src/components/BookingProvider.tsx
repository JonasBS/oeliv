'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export type RoomType = {
  id: string;
  name: string;
  price: string;
  description: string;
};

type BookingContextType = {
  isOpen: boolean;
  selectedRoom: RoomType | null;
  openBooking: (room?: RoomType) => void;
  closeBooking: () => void;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);

  const openBooking = (room?: RoomType) => {
    setSelectedRoom(room || null);
    setIsOpen(true);
  };

  const closeBooking = () => {
    setIsOpen(false);
    // Reset selected room after animation
    setTimeout(() => setSelectedRoom(null), 300);
  };

  return (
    <BookingContext.Provider value={{ isOpen, selectedRoom, openBooking, closeBooking }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
