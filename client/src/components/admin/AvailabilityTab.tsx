import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { availabilityApi, roomsApi, bookingsApi } from '../../services/api';
import type { Room, Booking } from '../../types';

interface AvailabilityDay {
  date: string;
  available: boolean;
  room_id: number;
  price?: number | null;
  open_units?: number | null;
  remaining_units?: number | null;
  capacity_units?: number | null;
}

type AvailabilityTarget = 'all' | number;

type AllAvailabilityRecord = {
  available: boolean;
  price: number | null;
  open_units: number | null;
  remaining_units?: number | null;
  capacity_units?: number | null;
  booked_units?: number | null;
};

type AllAvailabilityMap = Record<number, Record<string, AllAvailabilityRecord>>;

interface SelectionMeta {
  firstDate: string;
  lastDate: string;
  days: number;
  rooms: number;
  cells: number;
  hasBooking: boolean;
}

type SelectionState = 'none' | 'open' | 'closed' | 'mixed';

const AvailabilityTab = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<AvailabilityTarget>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [singleAvailability, setSingleAvailability] = useState<AvailabilityDay[]>([]);
  const [allAvailability, setAllAvailability] = useState<AllAvailabilityMap>({});
  const [viewLoading, setViewLoading] = useState(false);
  const [bulkRoomPrice, setBulkRoomPrice] = useState('');
  const [bulkAllPrice, setBulkAllPrice] = useState('');
  const [selectionAnchor, setSelectionAnchor] = useState<{ roomId: number; date: string } | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [allSelectedDates, setAllSelectedDates] = useState<Record<number, string[]>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragRoomId, setDragRoomId] = useState<number | null>(null);
  const dragMovedRef = useRef(false);
  const [panelPrice, setPanelPrice] = useState('');
  const [panelUnits, setPanelUnits] = useState('');
  const [bookingsByRoom, setBookingsByRoom] = useState<Record<number, Booking[]>>({});
  const [allViewMode, setAllViewMode] = useState<'matrix' | 'calendar'>('matrix');
  const [allCalendarRoomId, setAllCalendarRoomId] = useState<number | null>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (!rooms.length) return;

    if (selectedTarget === 'all') {
      loadAllAvailability();
    } else {
      loadSingleAvailability(selectedTarget);
    }
  }, [rooms, selectedTarget, currentMonth]);

  const loadRooms = async () => {
    try {
      const data = await roomsApi.getAll();
      setRooms(data);
      if (data.length > 0 && selectedTarget !== 'all') {
        setSelectedTarget(data[0].id);
      }
      if (data.length > 0 && allCalendarRoomId === null) {
        setAllCalendarRoomId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadSingleAvailability = async (roomId: number) => {
    setViewLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = addDays(endOfMonth(currentMonth), 1);
      
      const data = await availabilityApi.checkRange(
        roomId,
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      );
      
      setSingleAvailability(data);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setViewLoading(false);
    }
  };

  const loadAllAvailability = async () => {
    setViewLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = addDays(endOfMonth(currentMonth), 1);
      const data = await availabilityApi.getRange(
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      );

      const map: AllAvailabilityMap = {};
      data.forEach((item) => {
        if (!map[item.room_id]) {
          map[item.room_id] = {};
        }
        const fallbackPrice = typeof item.price === 'number' ? item.price : item.price ?? null;
        const capacityUnits = item.capacity_units ?? (rooms.find(r => r.id === item.room_id)?.unit_count ?? 1);
        map[item.room_id][item.date] = {
          available: Number(item.available) === 1,
          price: fallbackPrice,
          open_units: item.open_units ?? null,
          remaining_units: item.remaining_units ?? null,
          capacity_units: capacityUnits,
          booked_units: item.booked_units ?? null,
        };
      });

      setAllAvailability(map);
    } catch (error) {
      console.error('Error loading all availability:', error);
    } finally {
      setViewLoading(false);
    }
  };

  const loadBookings = useCallback(async () => {
    if (!rooms.length) return;
    try {
      const start = startOfMonth(currentMonth);
      const end = addDays(endOfMonth(currentMonth), 1);
      const data = await bookingsApi.getRange(
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      );

      const map: Record<number, Booking[]> = {};
      data.forEach((booking) => {
        if (!map[booking.room_id]) {
          map[booking.room_id] = [];
        }
        map[booking.room_id].push(booking);
      });

      setBookingsByRoom(map);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  }, [currentMonth, rooms]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const toggleAvailability = async (date: string, currentlyOpen: boolean) => {
    if (typeof selectedTarget !== 'number') return;

    try {
      const openUnits = currentlyOpen ? 0 : null;
      await availabilityApi.setAvailability(selectedTarget, date, { openUnits });
      await loadSingleAvailability(selectedTarget);
      await loadBookings();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleBulkRoomUpdate = async (shouldOpen: boolean) => {
    if (typeof selectedTarget !== 'number') return;

    setViewLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const days = eachDayOfInterval({ start, end });
      for (const day of days) {
        const dateStr = format(day, 'yyyy-MM-dd');
        const openUnits = shouldOpen ? null : 0;
        await availabilityApi.setAvailability(selectedTarget, dateStr, { openUnits });
      }

      await loadSingleAvailability(selectedTarget);
      await loadBookings();
    } catch (error) {
      console.error('Error bulk updating:', error);
    } finally {
      setViewLoading(false);
    }
  };

  const handleBulkAllUpdate = async (shouldOpen: boolean) => {
    if (!rooms.length) return;

    setViewLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const days = eachDayOfInterval({ start, end });

      for (const room of rooms) {
        for (const day of days) {
          const dateStr = format(day, 'yyyy-MM-dd');
          const openUnits = shouldOpen ? null : 0;
          await availabilityApi.setAvailability(room.id, dateStr, { openUnits });
        }
      }

      await loadAllAvailability();
      await loadBookings();
    } catch (error) {
      console.error('Error bulk updating all rooms:', error);
    } finally {
      setViewLoading(false);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const roomUnitCountMap = useMemo(() => {
    const map: Record<number, number> = {};
    rooms.forEach((room) => {
      map[room.id] = room.unit_count ?? 1;
    });
    return map;
  }, [rooms]);

  const getRoomUnitCount = useCallback((roomId: number) => roomUnitCountMap[roomId] ?? 1, [roomUnitCountMap]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const getPriceForDate = (date: Date | string): number | null => {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    const item = singleAvailability.find(a => a.date === dateStr);
    if (item && typeof item.price === 'number') return item.price;
    return item?.price ?? null;
  };

  const getAvailabilityRecord = useCallback((roomId: number, date: string) => {
    const allRecord = allAvailability[roomId]?.[date];
    if (allRecord) return allRecord;
    const singleRecord = singleAvailability.find(a => a.room_id === roomId && a.date === date);
    return singleRecord || null;
  }, [allAvailability, singleAvailability]);

  const clampUnits = useCallback((value: number, roomId: number) => {
    const maxUnits = getRoomUnitCount(roomId);
    if (value < 0) return 0;
    if (value > maxUnits) return maxUnits;
    return value;
  }, [getRoomUnitCount]);

  const resolveOpenUnits = useCallback((roomId: number, date: string) => {
    const record = getAvailabilityRecord(roomId, date);
    if (record && record.open_units !== null && record.open_units !== undefined) {
      return clampUnits(record.open_units, roomId);
    }
    if (record && record.available === false) {
      return 0;
    }
    return getRoomUnitCount(roomId);
  }, [getAvailabilityRecord, clampUnits, getRoomUnitCount]);

  const getBookedCountForDate = useCallback((roomId: number, date: string) => {
    const list = bookingsByRoom[roomId] || [];
    return list.filter(
      booking => date >= booking.check_in && date < booking.check_out
    ).length;
  }, [bookingsByRoom]);

  const getRemainingUnits = useCallback((roomId: number, date: string) => {
    const record = getAvailabilityRecord(roomId, date);
    if (record && typeof record.remaining_units === 'number') {
      return Math.max(record.remaining_units, 0);
    }
    const openUnits = resolveOpenUnits(roomId, date);
    const booked = getBookedCountForDate(roomId, date);
    return Math.max(openUnits - booked, 0);
  }, [getAvailabilityRecord, resolveOpenUnits, getBookedCountForDate]);

  const getBookingForDate = (roomId: number | null, date: string): Booking | null => {
    if (!roomId) return null;
    const list = bookingsByRoom[roomId] || [];
    return (
      list.find(
        booking => date >= booking.check_in && date < booking.check_out
      ) || null
    );
  };

  const isDateSelectable = (roomId: number | null, date: string) => {
    if (!roomId) return false;
    return !getBookingForDate(roomId, date);
  };

  const singleSelectionMeta = useMemo<SelectionMeta | null>(() => {
    if (selectedDates.length === 0 || typeof selectedTarget !== 'number') {
      return null;
    }
    const sorted = [...selectedDates].sort();
    const hasBooking = sorted.some(date => Boolean(getBookingForDate(selectedTarget, date)));
    return {
      firstDate: sorted[0],
      lastDate: sorted[sorted.length - 1],
      days: sorted.length,
      rooms: 1,
      cells: sorted.length,
      hasBooking
    };
  }, [selectedDates, selectedTarget, bookingsByRoom]);

  const allSelectionMeta = useMemo<SelectionMeta | null>(() => {
    const entries = Object.entries(allSelectedDates).filter(([, dates]) => dates.length > 0);
    if (!entries.length) {
      return null;
    }
    const allDates: string[] = [];
    entries.forEach(([, dates]) => {
      allDates.push(...dates);
    });
    const uniqueSortedDates = Array.from(new Set(allDates)).sort();
    const hasBooking = entries.some(([roomIdKey, dates]) =>
      dates.some(date => Boolean(getBookingForDate(Number(roomIdKey), date)))
    );
    return {
      firstDate: uniqueSortedDates[0],
      lastDate: uniqueSortedDates[uniqueSortedDates.length - 1],
      days: uniqueSortedDates.length,
      rooms: entries.length,
      cells: allDates.length,
      hasBooking
    };
  }, [allSelectedDates, bookingsByRoom]);

  const singleSelectionAvailabilityState = useMemo<SelectionState>(() => {
    if (!selectedDates.length) return 'none';
    let allOpen = true;
    let allClosed = true;

    selectedDates.forEach((date) => {
      const entry = singleAvailability.find(day => day.date === date);
      const isOpen = entry?.available ?? false;
      if (isOpen) {
        allClosed = false;
      } else {
        allOpen = false;
      }
    });

    if (allOpen) return 'open';
    if (allClosed) return 'closed';
    return 'mixed';
  }, [selectedDates, singleAvailability]);

  const allSelectionAvailabilityState = useMemo<SelectionState>(() => {
    const entries = Object.entries(allSelectedDates).filter(([, dates]) => dates.length > 0);
    if (!entries.length) return 'none';

    let allOpen = true;
    let allClosed = true;

    entries.forEach(([roomIdKey, dates]) => {
      const roomId = Number(roomIdKey);
      dates.forEach((date) => {
        const isOpen = allAvailability[roomId]?.[date]?.available ?? false;
        if (isOpen) {
          allClosed = false;
        } else {
          allOpen = false;
        }
      });
    });

    if (allOpen) return 'open';
    if (allClosed) return 'closed';
    return 'mixed';
  }, [allAvailability, allSelectedDates]);

  const selectedRoomData = typeof selectedTarget === 'number'
    ? rooms.find(r => r.id === selectedTarget)
    : null;
  const isAllButtonActive = selectedTarget === 'all' || allViewMode === 'calendar';

  const handleAllCellToggle = async (roomId: number, date: string, currentAvailable: boolean, isPast: boolean) => {
    if (isPast) return;
    if (getBookingForDate(roomId, date)) return;
    try {
      const openUnits = currentAvailable ? 0 : null;
      await availabilityApi.setAvailability(roomId, date, { openUnits });
      await loadAllAvailability();
      await loadBookings();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleBulkRoomPrice = async () => {
    if (typeof selectedTarget !== 'number') return;
    if (!bulkRoomPrice) return;

    setViewLoading(true);
    try {
      const priceValue = Number(bulkRoomPrice);
      if (Number.isNaN(priceValue)) {
        return;
      }

      for (const day of monthDays) {
        const dateStr = format(day, 'yyyy-MM-dd');
        await availabilityApi.setPrice(selectedTarget, dateStr, priceValue);
      }
      setBulkRoomPrice('');
      await loadSingleAvailability(selectedTarget);
    } catch (error) {
      console.error('Error updating prices for room:', error);
    } finally {
      setViewLoading(false);
    }
  };

  const handleBulkAllPrice = async () => {
    if (!bulkAllPrice) return;
    if (!rooms.length) return;

    setViewLoading(true);
    try {
      const priceValue = Number(bulkAllPrice);
      if (Number.isNaN(priceValue)) {
        return;
      }

      for (const room of rooms) {
        for (const day of monthDays) {
          const dateStr = format(day, 'yyyy-MM-dd');
          await availabilityApi.setPrice(room.id, dateStr, priceValue);
        }
      }

      setBulkAllPrice('');
      await loadAllAvailability();
    } catch (error) {
      console.error('Error updating prices for all rooms:', error);
    } finally {
      setViewLoading(false);
    }
  };

  const allViewStats = useMemo(() => {
    if (!rooms.length || !monthDays.length) {
      return {
        averageAvailablePercent: 0,
        soldOutDays: 0,
        bestDay: null as { date: Date; available: number } | null
      };
    }

    let availableCells = 0;
    const dayStats = monthDays.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      let availableRooms = 0;

      rooms.forEach((room) => {
        const remaining = getRemainingUnits(room.id, dateStr);
        if (remaining > 0) {
          availableRooms += 1;
          availableCells += 1;
        }
      });

      return { date: day, available: availableRooms };
    });

    const totalCells = rooms.length * monthDays.length;
    const averageAvailablePercent = totalCells ? Math.round((availableCells / totalCells) * 100) : 0;
    const bestDay = dayStats.reduce((best, current) => {
      if (!best) return current;
      return current.available > best.available ? current : best;
    }, null as { date: Date; available: number } | null);

    const soldOutDays = dayStats.filter(stat => stat.available === 0).length;

    return {
      averageAvailablePercent,
      soldOutDays,
      bestDay
    };
  }, [rooms, monthDays, getRemainingUnits]);

  const buildRangeBetweenDates = useCallback(
    (startDate: string, endDate: string) => {
      const startIndex = monthDays.findIndex(day => format(day, 'yyyy-MM-dd') === startDate);
      const endIndex = monthDays.findIndex(day => format(day, 'yyyy-MM-dd') === endDate);
      if (startIndex === -1 || endIndex === -1) return [];

      const [from, to] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
      return monthDays.slice(from, to + 1).map(day => format(day, 'yyyy-MM-dd'));
    },
    [monthDays]
  );

  const startDragSelection = useCallback((roomId: number, dateStr: string) => {
    if (!isDateSelectable(roomId, dateStr)) return;
    setIsDragging(true);
    setDragRoomId(roomId);
    dragMovedRef.current = false;
    setSelectionAnchor({ roomId, date: dateStr });
    if (selectedTarget === 'all') {
      setAllSelectedDates({ [roomId]: [dateStr] });
    } else {
      setSelectedDates([dateStr]);
    }
  }, [selectedTarget]);

  const extendDragSelection = useCallback((roomId: number, dateStr: string) => {
    if (!isDragging || dragRoomId !== roomId || !selectionAnchor) return;
    const range = buildRangeBetweenDates(selectionAnchor.date, dateStr);
    if (range.some(date => !isDateSelectable(roomId, date))) {
      return;
    }
    dragMovedRef.current = true;
    if (selectedTarget === 'all') {
      setAllSelectedDates({ [roomId]: range });
    } else {
      setSelectedDates(range);
    }
  }, [buildRangeBetweenDates, dragRoomId, isDragging, selectedTarget, selectionAnchor]);

  const clearSelection = useCallback(() => {
    setSelectionAnchor(null);
    setSelectedDates([]);
    setAllSelectedDates({});
    setPanelPrice('');
    setPanelUnits('');
  }, []);

  useEffect(() => {
    clearSelection();
  }, [selectedTarget, currentMonth, clearSelection]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragRoomId(null);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (selectedTarget === 'all') {
      const entries = Object.entries(allSelectedDates).filter(([, dates]) => dates.length > 0);
      if (!entries.length) {
        setPanelPrice('');
        return;
      }
      const [firstRoomIdKey, dates] = entries[0];
      const firstDate = dates[0];
      const record = allAvailability[Number(firstRoomIdKey)]?.[firstDate];
      setPanelPrice(record?.price != null ? String(record.price) : '');
      return;
    }

    if (selectedDates.length === 0) {
      setPanelPrice('');
      return;
    }
    const first = selectedDates[0];
    const price = getPriceForDate(first);
    setPanelPrice(price != null ? String(price) : '');
  }, [selectedTarget, selectedDates, allSelectedDates, allAvailability]);

  useEffect(() => {
    if (selectedTarget === 'all') {
      const entries = Object.entries(allSelectedDates).filter(([, dates]) => dates.length > 0);
      if (!entries.length) {
        setPanelUnits('');
        return;
      }

      let baseValue: number | null = null;
      let consistent = true;

      entries.forEach(([roomIdKey, dates]) => {
        const roomId = Number(roomIdKey);
        dates.forEach((date) => {
          const units = resolveOpenUnits(roomId, date);
          if (baseValue === null) {
            baseValue = units;
          } else if (baseValue !== units) {
            consistent = false;
          }
        });
      });

      if (consistent && baseValue !== null) {
        setPanelUnits(String(baseValue));
      } else {
        setPanelUnits('');
      }
      return;
    }

    if (typeof selectedTarget !== 'number' || selectedDates.length === 0) {
      setPanelUnits('');
      return;
    }

    let baseValue: number | null = null;
    let consistent = true;

    selectedDates.forEach((date) => {
      const units = resolveOpenUnits(selectedTarget, date);
      if (baseValue === null) {
        baseValue = units;
      } else if (baseValue !== units) {
        consistent = false;
      }
    });

    if (consistent && baseValue !== null) {
      setPanelUnits(String(baseValue));
    } else {
      setPanelUnits('');
    }
  }, [selectedTarget, selectedDates, allSelectedDates, resolveOpenUnits]);

  const applySelectionOpenUnits = async (targetUnits: number | null) => {
    const hasAllSelection = Object.values(allSelectedDates).some(dates => dates.length > 0);
    const hasSingleSelection = typeof selectedTarget === 'number' && selectedDates.length > 0;

    if (selectedTarget === 'all' && !hasAllSelection) return;
    if (selectedTarget !== 'all' && !hasSingleSelection) return;

    setViewLoading(true);
    try {
      if (selectedTarget === 'all') {
        const roomSelections = Object.entries(allSelectedDates);
        for (const [roomIdKey, dates] of roomSelections) {
          if (!dates.length) continue;
          const roomId = Number(roomIdKey);
          const maxUnits = getRoomUnitCount(roomId);
          const resolvedUnits =
            targetUnits === null ? null : Math.max(0, Math.min(targetUnits, maxUnits));
          for (const date of dates) {
            if (getBookingForDate(roomId, date)) continue;
            await availabilityApi.setAvailability(roomId, date, { openUnits: resolvedUnits });
          }
        }
        await loadAllAvailability();
        await loadBookings();
      } else if (typeof selectedTarget === 'number') {
        const maxUnits = getRoomUnitCount(selectedTarget);
        const resolvedUnits =
          targetUnits === null ? null : Math.max(0, Math.min(targetUnits, maxUnits));
        for (const date of selectedDates) {
          if (getBookingForDate(selectedTarget, date)) continue;
          await availabilityApi.setAvailability(selectedTarget, date, { openUnits: resolvedUnits });
        }
        await loadSingleAvailability(selectedTarget);
        await loadBookings();
      }
    } catch (error) {
      console.error('Error applying availability selection:', error);
    } finally {
      setViewLoading(false);
      clearSelection();
    }
  };

  const applySelectionPrice = async (priceValue: number | null) => {
    const hasAllSelection = Object.values(allSelectedDates).some(dates => dates.length > 0);
    const hasSingleSelection = typeof selectedTarget === 'number' && selectedDates.length > 0;

    if (selectedTarget === 'all' && !hasAllSelection) return;
    if (selectedTarget !== 'all' && !hasSingleSelection) return;

    setViewLoading(true);
    try {
      if (selectedTarget === 'all') {
        const roomSelections = Object.entries(allSelectedDates);
        for (const [roomIdKey, dates] of roomSelections) {
          const roomId = Number(roomIdKey);
          for (const date of dates) {
            if (getBookingForDate(roomId, date)) continue;
            await availabilityApi.setPrice(roomId, date, priceValue);
          }
        }
        await loadAllAvailability();
      } else if (typeof selectedTarget === 'number') {
        for (const date of selectedDates) {
          if (getBookingForDate(selectedTarget, date)) continue;
          await availabilityApi.setPrice(selectedTarget, date, priceValue);
        }
        await loadSingleAvailability(selectedTarget);
      }
    } catch (error) {
      console.error('Error applying price selection:', error);
    } finally {
      setViewLoading(false);
      clearSelection();
    }
  };

  const handlePanelPriceSave = () => {
    const hasSelection = selectedTarget === 'all'
      ? Boolean(allSelectionMeta)
      : Boolean(singleSelectionMeta);
    if (!hasSelection) return;
    if (panelPrice === '') {
      applySelectionPrice(null);
      return;
    }
    const parsed = Number(panelPrice);
    if (Number.isNaN(parsed)) return;
    applySelectionPrice(parsed);
  };

  const handlePanelUnitsSave = () => {
    const hasSelection = selectedTarget === 'all'
      ? Boolean(allSelectionMeta)
      : Boolean(singleSelectionMeta);
    if (!hasSelection || panelUnits === '') return;
    const parsed = Number(panelUnits);
    if (Number.isNaN(parsed)) return;
    applySelectionOpenUnits(parsed);
  };

  const handlePanelAvailabilityChange = (shouldOpen: boolean) => {
    const hasSelection = selectedTarget === 'all'
      ? Boolean(allSelectionMeta)
      : Boolean(singleSelectionMeta);
    if (!hasSelection) return;
    if (shouldOpen) {
      applySelectionOpenUnits(null);
    } else {
      applySelectionOpenUnits(0);
    }
  };

  const formatRangeLabel = (from: string, to: string) => {
    const fromLabel = format(new Date(from), 'd. MMM', { locale: da });
    if (from === to) {
      return fromLabel;
    }
    const toLabel = format(new Date(to), 'd. MMM', { locale: da });
    return `${fromLabel} – ${toLabel}`;
  };

  const renderSelectionPanel = (mode: 'single' | 'all') => {
    const meta = mode === 'all' ? allSelectionMeta : singleSelectionMeta;
    const availabilityState = mode === 'all' ? allSelectionAvailabilityState : singleSelectionAvailabilityState;
    const hasSelection = Boolean(meta);
    const emptyTitle = mode === 'all'
      ? 'Markér celler i oversigten'
      : 'Markér datoer i kalenderen';
    const emptySubtitle = mode === 'all'
      ? 'Hold venstre museknap nede og træk for at flytte flere værelser på én gang.'
      : 'Hold venstre museknap nede og træk for at vælge en periode.';
    const disableAvailabilityActions = !hasSelection || Boolean(meta?.hasBooking) || viewLoading;
    const disablePriceActions = !hasSelection || Boolean(meta?.hasBooking) || viewLoading;

    const selectedRoomIds =
      mode === 'all'
        ? Object.entries(allSelectedDates)
            .filter(([, dates]) => dates.length > 0)
            .map(([roomId]) => Number(roomId))
        : typeof selectedTarget === 'number'
          ? [selectedTarget]
          : [];

    const selectionUnitCap = selectedRoomIds.length
      ? Math.max(...selectedRoomIds.map((id) => getRoomUnitCount(id)))
      : 0;

    const disableUnitsActions =
      !hasSelection || Boolean(meta?.hasBooking) || viewLoading || selectionUnitCap === 0;

    const handleUnitsStep = (delta: number) => {
      if (disableUnitsActions) return;
      const currentValue = panelUnits === '' ? 0 : Number(panelUnits);
      if (Number.isNaN(currentValue)) {
        setPanelUnits('');
        return;
      }
      const nextValue = Math.max(0, Math.min(currentValue + delta, selectionUnitCap));
      setPanelUnits(String(nextValue));
    };

    return (
      <aside className="availability-panel airbnb-panel">
        {!hasSelection || !meta ? (
          <div className="panel-empty">
            <p>{emptyTitle}</p>
            <p>{emptySubtitle}</p>
          </div>
        ) : (
          <>
            <div className="panel-selection-pill">
              <div>
                <p className="panel-pill-label">{formatRangeLabel(meta.firstDate, meta.lastDate)}</p>
                <p className="panel-pill-subtitle">
                  {meta.days} {meta.days === 1 ? 'dag' : 'dage'}
                  {mode === 'all' && (
                    <> · {meta.rooms} {meta.rooms === 1 ? 'værelse' : 'værelser'}</>
                  )}
                </p>
              </div>
              <button
                type="button"
                className="panel-pill-clear"
                onClick={clearSelection}
                aria-label="Ryd markering"
              >
                ×
              </button>
            </div>

            {meta.hasBooking && (
              <div className="panel-warning">
                Denne periode overlapper en booking og kan ikke ændres.
              </div>
            )}

            <div className="panel-toggle-card">
              <div className="panel-toggle-header">
                <span>Tilgængelig</span>
                <span className={`panel-status-dot ${availabilityState === 'closed' ? 'closed' : 'open'}`}></span>
              </div>
              <div className="panel-toggle-chip">
                <button
                  type="button"
                  aria-pressed={availabilityState === 'closed'}
                  className={`panel-toggle-btn negative ${availabilityState === 'closed' ? 'active' : ''}`}
                  onClick={() => handlePanelAvailabilityChange(false)}
                  disabled={disableAvailabilityActions}
                >
                  ×
                </button>
                <button
                  type="button"
                  aria-pressed={availabilityState === 'open'}
                  className={`panel-toggle-btn positive ${availabilityState === 'open' ? 'active' : ''}`}
                  onClick={() => handlePanelAvailabilityChange(true)}
                  disabled={disableAvailabilityActions}
                >
                  ✓
                </button>
              </div>
            </div>

            <div className="panel-units-card">
              <div className="panel-units-header">
                <span>Åbne enheder</span>
                <small>{selectionUnitCap ? `0 – ${selectionUnitCap}` : 'Ingen kapacitet'}</small>
              </div>
              <div className="panel-units-control">
                <button
                  type="button"
                  onClick={() => handleUnitsStep(-1)}
                  disabled={disableUnitsActions}
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  max={selectionUnitCap}
                  placeholder="—"
                  value={panelUnits}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === '') {
                      setPanelUnits('');
                      return;
                    }
                    const parsed = Number(value);
                    if (Number.isNaN(parsed)) return;
                    const nextValue = Math.max(0, Math.min(parsed, selectionUnitCap));
                    setPanelUnits(String(nextValue));
                  }}
                  disabled={disableUnitsActions}
                />
                <button
                  type="button"
                  onClick={() => handleUnitsStep(1)}
                  disabled={disableUnitsActions}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="btn-secondary btn-block"
                onClick={handlePanelUnitsSave}
                disabled={disableUnitsActions || panelUnits === ''}
              >
                Gem enheder
              </button>
            </div>

            <div className="panel-price-card">
              <div className="panel-price-header">
                <span>Pris pr. nat</span>
                {mode === 'all' && (
                  <small>Anvendes på alle valgte værelser</small>
                )}
              </div>
              <div className="panel-price-display">
                <span>DKK</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={panelPrice}
                  onChange={(event) => setPanelPrice(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handlePanelPriceSave();
                    }
                  }}
                />
              </div>
              <button
                type="button"
                className="btn-primary btn-block panel-price-btn"
                onClick={handlePanelPriceSave}
                disabled={disablePriceActions}
              >
                Gem pris
              </button>
            </div>

            <button className="btn-text panel-clear-btn" type="button" onClick={clearSelection}>
              Ryd markering
            </button>
          </>
        )}
      </aside>
    );
  };

  const renderAllAvailability = () => {
    if (viewLoading && Object.keys(allAvailability).length === 0) {
      return (
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Indlæser tilgængelighed...</p>
        </div>
      );
    }

    return (
      <>
        <div className="all-availability-summary">
          <div className="summary-card">
            <p>Gennemsnitlig ledige værelser</p>
            <strong>{allViewStats.averageAvailablePercent}%</strong>
          </div>
          <div className="summary-card">
            <p>Helt udsolgte dage</p>
            <strong>{allViewStats.soldOutDays}</strong>
          </div>
          <div className="summary-card">
            <p>Bedst dækkede dag</p>
            <strong>
              {allViewStats.bestDay
                ? `${format(allViewStats.bestDay.date, 'd. MMM', { locale: da })} (${allViewStats.bestDay.available} værelser)`
                : '—'}
            </strong>
          </div>
        </div>

        <div className="availability-layout availability-layout-all">
          <div className="availability-calendar-column">
            <div className="bulk-actions all-mode">
              <button 
                onClick={() => handleBulkAllUpdate(true)}
                className="bulk-btn bulk-btn-available"
                disabled={viewLoading}
              >
                Åbn alle værelser
              </button>
              <button 
                onClick={() => handleBulkAllUpdate(false)}
                className="bulk-btn bulk-btn-unavailable"
                disabled={viewLoading}
              >
                Luk alle værelser
              </button>
            </div>

            <div className="bulk-price-row all-mode">
              <label>Indstil ens pris for alle værelser (hele måneden)</label>
              <div className="price-input-wrap">
                <span>DKK</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="—"
                  value={bulkAllPrice}
                  onChange={(event) => setBulkAllPrice(event.target.value)}
                />
              </div>
              <button
                className="btn-primary"
                type="button"
                disabled={viewLoading || !bulkAllPrice}
                onClick={handleBulkAllPrice}
              >
                Anvend pris
              </button>
            </div>

            <div className="all-availability-scroll">
              <table className="all-availability-table">
                <thead>
                  <tr>
                    <th>Værelse</th>
                    {monthDays.map((day) => (
                      <th key={day.toISOString()}>
                        <span>{format(day, 'd.', { locale: da })}</span>
                        <small>{format(day, 'MMM', { locale: da })}</small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <th>{room.name}</th>
                  {monthDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const entry = allAvailability[room.id]?.[dateStr];
                    const priceValue = entry?.price ?? null;
                    const isPast = day < today;
                    const selectionKey = allSelectedDates[room.id] || [];
                    const isSelected = selectionKey.includes(dateStr);
                    const bookingInfo = getBookingForDate(room.id, dateStr);
                    const isBooked = Boolean(bookingInfo);
                    const remainingUnits = getRemainingUnits(room.id, dateStr);
                    const capacityUnits = getRoomUnitCount(room.id);
                    const openUnits = resolveOpenUnits(room.id, dateStr);
                    const isAvailable = remainingUnits > 0;

                    return (
                      <td
                        key={`${room.id}-${dateStr}`}
                        className={`all-availability-cell ${isAvailable ? 'available' : 'unavailable'} ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''} ${openUnits < capacityUnits ? 'capacity-reduced' : ''}`}
                        onMouseDown={(event) => {
                          if (isPast || event.button !== 0 || isBooked) return;
                          event.preventDefault();
                          startDragSelection(room.id, dateStr);
                        }}
                        onMouseEnter={() => extendDragSelection(room.id, dateStr)}
                        onClick={() => {
                          if (dragMovedRef.current) {
                            dragMovedRef.current = false;
                            return;
                          }
                          if (isBooked) return;
                          handleAllCellToggle(room.id, dateStr, isAvailable, isPast);
                        }}
                        role="button"
                        tabIndex={isPast ? -1 : 0}
                        aria-label={`Skift ${room.name} ${format(day, 'd. MMM', { locale: da })}`}
                        onKeyDown={(event) => {
                          if (isPast || isBooked) return;
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleAllCellToggle(room.id, dateStr, isAvailable, isPast);
                          }
                        }}
                      >
                        <div className="cell-state">
                          {isBooked ? '📌 Booking' : `${remainingUnits}/${capacityUnits} ledige`}
                        </div>
                        {!isBooked && openUnits < capacityUnits && (
                          <div className="cell-open-note">
                            {openUnits} af {capacityUnits} åbne
                          </div>
                        )}
                        <div className="cell-price-label">
                          {priceValue != null ? `DKK ${priceValue}` : '—'}
                        </div>
                        {isBooked && (
                          <span
                            className="cell-booked-dot"
                            title={`Booking: ${bookingInfo?.guest_name || ''}`}
                          ></span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
                </tbody>
              </table>
            </div>

            <div className="availability-legend">
              <span><span className="legend-dot available" /> Ledig</span>
              <span><span className="legend-dot unavailable" /> Optaget</span>
              <span><span className="legend-dot booked" /> Booking</span>
            </div>
          </div>
          <div className="availability-panel-column">
            {renderSelectionPanel('all')}
          </div>
        </div>
      </>
    );
  };

  const renderSingleAvailability = () => {
    const roomId = typeof selectedTarget === 'number' ? selectedTarget : null;
    if (!roomId || !selectedRoomData) return null;
    return (
      <>
        <div className="availability-info-card">
          <h3>
            {allViewMode === 'calendar' ? `Alle værelser · ${selectedRoomData.name}` : selectedRoomData.name}
          </h3>
          <p>
            {allViewMode === 'calendar'
              ? 'Træk hen over kalenderen for at markere datoer på dette værelse.'
              : 'Administrer tilgængelighed måned for måned'}
          </p>
        </div>

        <div className="availability-layout">
          <div className="availability-calendar-column">

            {viewLoading ? (
              <div className="admin-loading">
                <div className="spinner"></div>
                <p>Indlæser tilgængelighed...</p>
              </div>
            ) : (
              <div className="availability-calendar">
                {monthDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isPast = day < today;
                  const bookingInfo = getBookingForDate(roomId, dateStr);
                  const isBooked = Boolean(bookingInfo);
                  const priceValue = getPriceForDate(day);
                  const remainingUnits = getRemainingUnits(roomId, dateStr);
                  const capacityUnits = getRoomUnitCount(roomId);
                  const isAvailable = remainingUnits > 0;

                  return (
                    <div 
                      key={dateStr}
                      className={`availability-day ${isAvailable ? 'available' : 'unavailable'} ${isPast ? 'past' : ''} ${selectedDates.includes(dateStr) ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                      onMouseDown={(event) => {
                        if (isPast || event.button !== 0 || isBooked) return;
                        event.preventDefault();
                        startDragSelection(roomId, dateStr);
                      }}
                      onMouseEnter={() => {
                        if (isBooked) return;
                        extendDragSelection(roomId, dateStr);
                      }}
                      onClick={() => {
                        if (dragMovedRef.current) {
                          dragMovedRef.current = false;
                          return;
                        }
                        if (isPast || isBooked) return;
                        toggleAvailability(dateStr, isAvailable);
                      }}
                    >
                      {isBooked && (
                        <span className="day-booked-dot" title={`Booking: ${bookingInfo?.guest_name || 'Reserveret'}`}></span>
                      )}
                      <div className="day-number">{format(day, 'd')}</div>
                      <div className="day-name">{format(day, 'EEE', { locale: da })}</div>
                      <div className="day-status-pill">
                        {isBooked ? 'Booket' : isAvailable ? 'Tilgængelig' : 'Lukket'}
                      </div>
                      <div className="day-capacity">
                        {remainingUnits}/{capacityUnits} enheder
                      </div>
                      <div className="day-price-label">
                        {priceValue != null ? `DKK ${priceValue}` : 'Ingen pris'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="availability-panel-column">
            {renderSelectionPanel('single')}
          </div>
        </div>
      </>
    );
  };

  const handleSelectAll = () => {
    setAllViewMode('matrix');
    setSelectedTarget('all');
    clearSelection();
  };

  const handleRoomButtonClick = (room: Room) => {
    if (allViewMode === 'calendar' && selectedTarget !== 'all') {
      setAllCalendarRoomId(room.id);
      setSelectedTarget(room.id);
      clearSelection();
      return;
    }
    setAllViewMode('matrix');
    setSelectedTarget(room.id);
  };

  const handleAllModeChange = (mode: 'matrix' | 'calendar') => {
    if (mode === 'matrix') {
      setAllViewMode('matrix');
      setSelectedTarget('all');
      clearSelection();
      return;
    }
    const targetRoom = allCalendarRoomId ?? rooms[0]?.id;
    if (!targetRoom) return;
    setAllViewMode('calendar');
    setAllCalendarRoomId(targetRoom);
    setSelectedTarget(targetRoom);
    clearSelection();
  };

  return (
    <div className="availability-tab">
      <div className="tab-header">
        <h2>Tilgængelighed</h2>
        <div className="room-selector-header">
          <button
            className={`room-selector-btn ${isAllButtonActive ? 'active' : ''}`}
            onClick={handleSelectAll}
          >
            Alle værelser
          </button>
          {rooms.map((room) => (
            <button
              key={room.id}
              className={`room-selector-btn ${selectedTarget === room.id && allViewMode !== 'calendar' ? 'active' : ''}`}
              onClick={() => handleRoomButtonClick(room)}
            >
              {room.name}
            </button>
          ))}
        </div>
      </div>

      {(selectedTarget === 'all' || allViewMode === 'calendar') && (
        <div className="all-view-toggle">
          <button
            type="button"
            className={allViewMode === 'matrix' ? 'active' : ''}
            onClick={() => handleAllModeChange('matrix')}
          >
            Oversigt
          </button>
          <button
            type="button"
            className={allViewMode === 'calendar' ? 'active' : ''}
            onClick={() => handleAllModeChange('calendar')}
            disabled={!rooms.length}
          >
            Kalender
          </button>
        </div>
      )}

      <div className="calendar-controls">
        <button onClick={previousMonth} className="calendar-nav-btn">
          ← Forrige måned
        </button>
        <h3 className="calendar-month-title">
          {format(currentMonth, 'MMMM yyyy', { locale: da })}
        </h3>
        <button onClick={nextMonth} className="calendar-nav-btn">
          Næste måned →
        </button>
      </div>

      {selectedTarget === 'all' ? renderAllAvailability() : renderSingleAvailability()}
    </div>
  );
};

export default AvailabilityTab;
