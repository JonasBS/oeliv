'use client';

import { useBooking, type RoomType } from './BookingProvider';

type RoomBookingButtonProps = {
  room: RoomType;
  variant?: 'inline' | 'full';
  label?: string;
};

export const RoomBookingButton = ({ room, variant = 'inline', label = 'Book nu' }: RoomBookingButtonProps) => {
  const { openBooking } = useBooking();

  const handleClick = () => {
    openBooking(room);
  };

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-3 bg-[#2d2820] text-[#f4f2eb] px-10 py-4 text-[12px] tracking-[0.15em] uppercase hover:bg-[#1c1a17] transition-colors"
      >
        {label}
        <span>-&gt;</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex items-center gap-2 text-[#2d2820] text-[11px] tracking-[0.15em] uppercase"
    >
      <span className="pb-0.5 border-b border-[#2d2820] group-hover:border-[#4a5a42] transition-colors">
        {label}
      </span>
      <span className="group-hover:translate-x-1 transition-transform">-&gt;</span>
    </button>
  );
};

