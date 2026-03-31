import React, { useState, useEffect } from 'react';
import { AccountingRecord } from '../types';
import { Save, X, Calculator, Users, DollarSign, CheckCircle, XCircle, Calendar, Tag, UserCheck, UserPlus, Wallet, Plus, Minus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { TicketType } from '../types';

interface RecordFormProps {
  initialData?: AccountingRecord;
  onSave: (record: Omit<AccountingRecord, 'id'>) => void;
  onCancel: () => void;
  userId: string;
  defaultGeneralPrice?: number;
  defaultStudentPrice?: number;
}

export const RecordForm: React.FC<RecordFormProps> = ({ 
  initialData, 
  onSave, 
  onCancel, 
  userId,
  defaultGeneralPrice = 300,
  defaultStudentPrice = 200
}) => {
  const [formData, setFormData] = useState<Omit<AccountingRecord, 'id'>>({
    userId,
    date: new Date().toISOString().split('T')[0],
    eventName: new Date().toLocaleString('zh-TW', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    }).replace(/\//g, '-'),
    generalPrice: initialData?.generalPrice ?? defaultGeneralPrice,
    studentPrice: initialData?.studentPrice ?? defaultStudentPrice,
    leaderCount: 0,
    followerCount: 0,
    seasonPassCount: 0,
    seasonPassLeaderCount: 0,
    seasonPassFollowerCount: 0,
    studentPassCount: 0,
    ticketTypes: initialData?.ticketTypes ?? [
      { id: 'general', name: '一般票 (General)', price: initialData?.generalPrice ?? defaultGeneralPrice, leaderCount: 0, followerCount: 0 },
      { id: 'student', name: '學生票 (Student)', price: initialData?.studentPrice ?? defaultStudentPrice, leaderCount: 0, followerCount: 0 },
      { id: 'season', name: '季票 (Season Pass)', price: 0, leaderCount: 0, followerCount: 0 }
    ],
    cash1000: 0,
    cash500: 0,
    cash100: 0,
    cash50: 0,
    cash10: 0,
    cash5: 0,
    cash1: 0,
    startingCash: 0,
    expectedRevenue: 0,
    actualCash: 0,
    isBalanced: false,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (initialData) {
      const data = { ...initialData };
      if (!data.ticketTypes || data.ticketTypes.length === 0) {
        // Calculate legacy counts for migration
        const totalAttendees = data.leaderCount + data.followerCount;
        const paidAttendees = Math.max(0, totalAttendees - data.seasonPassCount);
        const studentAttendees = Math.min(paidAttendees, data.studentPassCount);
        const generalAttendees = paidAttendees - studentAttendees;

        // Legacy data doesn't have split for ticket types, so we put all in leader for simplicity or split 50/50
        // But better to just put in leader and let user adjust if needed, or try to guess.
        // Actually, let's just use the total counts we have.
        data.ticketTypes = [
          { id: 'general', name: '一般票 (General)', price: data.generalPrice, leaderCount: generalAttendees, followerCount: 0 },
          { id: 'student', name: '學生票 (Student)', price: data.studentPrice, leaderCount: studentAttendees, followerCount: 0 },
          { id: 'season', name: '季票 (Season Pass)', price: 0, leaderCount: data.seasonPassLeaderCount ?? data.seasonPassCount, followerCount: data.seasonPassFollowerCount ?? 0 }
        ];
      } else if (!data.ticketTypes.some(t => t.id === 'season')) {
        // If ticketTypes exists but missing season (from a previous version of this update)
        data.ticketTypes.push({ 
          id: 'season', 
          name: '季票 (Season Pass)', 
          price: 0, 
          leaderCount: data.seasonPassLeaderCount ?? data.seasonPassCount ?? 0, 
          followerCount: data.seasonPassFollowerCount ?? 0 
        });
      }
      
      // Ensure season pass counts are initialized if missing
      if (data.seasonPassLeaderCount === undefined) data.seasonPassLeaderCount = data.seasonPassCount;
      if (data.seasonPassFollowerCount === undefined) data.seasonPassFollowerCount = 0;

      setFormData(data);
    }
  }, [initialData]);

  // Update prices if defaults change and we are not editing an existing record
  useEffect(() => {
    if (!initialData) {
      setFormData(prev => {
        const currentTickets = prev.ticketTypes ?? [];
        const hasGeneral = currentTickets.some(t => t.id === 'general');
        const hasStudent = currentTickets.some(t => t.id === 'student');
        const hasSeason = currentTickets.some(t => t.id === 'season');

        let newTickets = [...currentTickets];

        if (hasGeneral) {
          newTickets = newTickets.map(t => t.id === 'general' ? { ...t, price: defaultGeneralPrice } : t);
        } else {
          newTickets.unshift({ id: 'general', name: '一般票 (General)', price: defaultGeneralPrice, leaderCount: 0, followerCount: 0 });
        }

        if (hasStudent) {
          newTickets = newTickets.map(t => t.id === 'student' ? { ...t, price: defaultStudentPrice } : t);
        } else {
          // Insert after general or at start
          const generalIndex = newTickets.findIndex(t => t.id === 'general');
          newTickets.splice(generalIndex + 1, 0, { id: 'student', name: '學生票 (Student)', price: defaultStudentPrice, leaderCount: 0, followerCount: 0 });
        }

        if (!hasSeason) {
          newTickets.push({ id: 'season', name: '季票 (Season Pass)', price: 0, leaderCount: 0, followerCount: 0 });
        }

        return {
          ...prev,
          generalPrice: defaultGeneralPrice,
          studentPrice: defaultStudentPrice,
          ticketTypes: newTickets
        };
      });
    }
  }, [defaultGeneralPrice, defaultStudentPrice, initialData]);

  useEffect(() => {
    // Calculate expected revenue and total counts
    let expectedRevenue = 0;
    let sumOthersLeader = 0;
    let sumOthersFollower = 0;
    let generalTicket: TicketType | undefined;
    let seasonPassCount = 0;
    let seasonPassLeaderCount = 0;
    let seasonPassFollowerCount = 0;
    let studentPassCount = 0;
    
    if (formData.ticketTypes && formData.ticketTypes.length > 0) {
      formData.ticketTypes.forEach(ticket => {
        if (ticket.id === 'general') {
          generalTicket = ticket;
        } else {
          expectedRevenue += ticket.price * (ticket.leaderCount + ticket.followerCount);
          sumOthersLeader += ticket.leaderCount;
          sumOthersFollower += ticket.followerCount;
          
          if (ticket.id === 'student') {
            studentPassCount = ticket.leaderCount + ticket.followerCount;
          }
          if (ticket.id === 'season') {
            seasonPassCount = ticket.leaderCount + ticket.followerCount;
            seasonPassLeaderCount = ticket.leaderCount;
            seasonPassFollowerCount = ticket.followerCount;
          }
        }
      });
    }

    const calculatedGeneralLeader = Math.max(0, formData.leaderCount - sumOthersLeader);
    const calculatedGeneralFollower = Math.max(0, formData.followerCount - sumOthersFollower);

    if (generalTicket) {
      expectedRevenue += generalTicket.price * (calculatedGeneralLeader + calculatedGeneralFollower);
    }

    // Calculate actual cash
    const totalCash = 
      (formData.cash1000 * 1000) +
      (formData.cash500 * 500) +
      (formData.cash100 * 100) +
      (formData.cash50 * 50) +
      (formData.cash10 * 10) +
      (formData.cash5 * 5) +
      (formData.cash1 * 1);
    
    const actualCash = totalCash - formData.startingCash;
    const isBalanced = expectedRevenue === actualCash;

    setFormData(prev => {
      const needsTicketUpdate = prev.ticketTypes?.some(t => 
        t.id === 'general' && (t.leaderCount !== calculatedGeneralLeader || t.followerCount !== calculatedGeneralFollower)
      );

      const newState = { 
        ...prev, 
        expectedRevenue, 
        actualCash, 
        isBalanced,
        seasonPassCount,
        seasonPassLeaderCount,
        seasonPassFollowerCount,
        studentPassCount
      };

      if (needsTicketUpdate) {
        newState.ticketTypes = prev.ticketTypes?.map(t => 
          t.id === 'general' ? { ...t, leaderCount: calculatedGeneralLeader, followerCount: calculatedGeneralFollower } : t
        );
      }

      return newState;
    });
  }, [
    formData.ticketTypes,
    formData.leaderCount,
    formData.followerCount,
    formData.cash1000, formData.cash500, formData.cash100, formData.cash50, formData.cash10, formData.cash5, formData.cash1,
    formData.startingCash
  ]);

  const handleTicketTypeChange = (id: string, field: keyof TicketType, value: string | number) => {
    if (id === 'general' && (field === 'leaderCount' || field === 'followerCount')) return;
    setFormData(prev => {
      let safeValue: string | number = value;
      if (typeof value === 'string' && (field === 'price' || field === 'leaderCount' || field === 'followerCount')) {
        const cleanValue = value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
        safeValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
      } else if (typeof value === 'number') {
        safeValue = isNaN(value) ? 0 : value;
      }

      // Constraint: Individual ticket count cannot exceed total count minus other non-general tickets
      if (field === 'leaderCount' || field === 'followerCount') {
        const totalField = field === 'leaderCount' ? 'leaderCount' : 'followerCount';
        const totalValue = prev[totalField] as number;
        
        const otherTicketsSum = (prev.ticketTypes ?? [])
          .filter(t => t.id !== id && t.id !== 'general')
          .reduce((sum, t) => sum + (t[field] as number), 0);
        
        const maxAllowed = Math.max(0, totalValue - otherTicketsSum);
        if ((safeValue as number) > maxAllowed) {
          safeValue = maxAllowed;
        }
      }

      const updatedTicketTypes = prev.ticketTypes?.map(ticket => 
        ticket.id === id ? { ...ticket, [field]: safeValue } : ticket
      );
      
      return {
        ...prev,
        ticketTypes: updatedTicketTypes
      };
    });
  };

  const addTicketType = () => {
    const newTicket: TicketType = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新票種',
      price: 0,
      leaderCount: 0,
      followerCount: 0
    };
    setFormData(prev => ({
      ...prev,
      ticketTypes: [...(prev.ticketTypes ?? []), newTicket]
    }));
  };

  const removeTicketType = (id: string) => {
    if (['general', 'student', 'season'].includes(id)) return;
    setFormData(prev => ({
      ...prev,
      ticketTypes: prev.ticketTypes?.filter(ticket => ticket.id !== id)
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const isNumericField = [
      'generalPrice', 'studentPrice', 'leaderCount', 'followerCount', 
      'cash1000', 'cash500', 'cash100', 'cash50', 'cash10', 'cash5', 'cash1', 
      'startingCash'
    ].includes(name);

    if (type === 'number' || isNumericField) {
      const cleanValue = value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
      const numValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
      
      setFormData(prev => {
        const newState = {
          ...prev,
          [name]: numValue
        };

        // If total count is decreased, we need to ensure ticket types don't exceed it
        if (name === 'leaderCount' || name === 'followerCount') {
          const field = name === 'leaderCount' ? 'leaderCount' : 'followerCount';
          let currentSum = 0;
          newState.ticketTypes = prev.ticketTypes?.map(t => {
            if (t.id === 'general') return t;
            const val = t[field] as number;
            const remaining = Math.max(0, numValue - currentSum);
            const cappedVal = Math.min(val, remaining);
            currentSum += cappedVal;
            return { ...t, [field]: cappedVal };
          });
        }

        return newState;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputClasses = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-gray-700 font-medium";
  const labelClasses = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex justify-between items-center border-b border-gray-50 pb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {initialData ? '編輯記帳' : '新增記帳'}
              <span className="block text-sm font-medium text-gray-400 mt-1">
                {initialData ? 'Edit existing accounting record' : 'Create a new accounting record for your event'}
              </span>
            </h2>
          </div>
          <button 
            type="button" 
            onClick={onCancel} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Basic Info */}
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-blue-600 mb-2">
                <Tag size={18} />
                <h3 className="font-bold uppercase tracking-widest text-xs">活動資訊 (Event Info)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClasses}>活動名稱 (Event Name)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="eventName" 
                      value={formData.eventName} 
                      onChange={handleChange} 
                      required 
                      className={inputClasses} 
                      placeholder="e.g. Friday Swing Party" 
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>日期 (Date)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="date" 
                      name="date" 
                      value={formData.date} 
                      onChange={handleChange} 
                      required 
                      className={`${inputClasses} pl-10`} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition-all"
                >
                  <span>{showAdvanced ? '隱藏進階設定' : '顯示進階設定 (票價設定)'}</span>
                  <motion.span animate={{ rotate: showAdvanced ? 180 : 0 }}>
                    <Calculator size={14} />
                  </motion.span>
                </button>
                
                {showAdvanced && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 space-y-4 overflow-hidden bg-blue-50/50 p-4 rounded-2xl border border-blue-100"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest">票種設定 (Ticket Types)</h4>
                      <button 
                        type="button"
                        onClick={addTicketType}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={14} className="mr-1" /> 新增票種
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.ticketTypes?.map((ticket) => (
                        <div key={ticket.id} className="grid grid-cols-12 gap-2 items-end bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                          <div className="col-span-6">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">票種名稱</label>
                            <input 
                              type="text" 
                              value={ticket.name} 
                              onChange={(e) => handleTicketTypeChange(ticket.id, 'name', e.target.value)}
                              className="w-full text-sm font-bold text-gray-700 border-b border-gray-200 focus:border-blue-500 outline-none pb-1"
                            />
                          </div>
                          <div className="col-span-5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">單價 (Price)</label>
                            <input 
                              type="text" 
                              inputMode="numeric"
                              value={ticket.price} 
                              onChange={(e) => handleTicketTypeChange(ticket.id, 'price', e.target.value)}
                              className="w-full text-sm font-bold text-gray-700 border-b border-gray-200 focus:border-blue-500 outline-none pb-1"
                            />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            {!['general', 'student', 'season'].includes(ticket.id) && (
                              <button 
                                type="button"
                                onClick={() => removeTicketType(ticket.id)}
                                className="text-rose-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center space-x-2 text-purple-600 mb-2">
                <Users size={18} />
                <h3 className="font-bold uppercase tracking-widest text-xs">人數統計 (Attendance)</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {/* Total Attendees Section */}
                <div className="p-4 rounded-2xl border bg-purple-50/30 border-purple-100/50">
                  <div className="flex items-center justify-between mb-3">
                    <label className={`${labelClasses} text-purple-600`}>
                      總人數 (Total Attendees)
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-purple-400 uppercase mb-1 block">Total Leader</label>
                      <div className="flex items-center space-x-2">
                        <button 
                          type="button"
                          onClick={() => handleChange({ target: { name: 'leaderCount', value: String(Math.max(0, formData.leaderCount - 1)), type: 'number' } } as any)}
                          className="p-1 rounded-full hover:bg-purple-100 text-purple-600 transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          name="leaderCount"
                          value={formData.leaderCount} 
                          onChange={handleChange} 
                          className="w-full bg-transparent text-xl font-bold border-b border-purple-200 focus:border-purple-500 outline-none text-purple-900 text-center" 
                        />
                        <button 
                          type="button"
                          onClick={() => handleChange({ target: { name: 'leaderCount', value: String(formData.leaderCount + 1), type: 'number' } } as any)}
                          className="p-1 rounded-full hover:bg-purple-100 text-purple-600 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-purple-400 uppercase mb-1 block">Total Follower</label>
                      <div className="flex items-center space-x-2">
                        <button 
                          type="button"
                          onClick={() => handleChange({ target: { name: 'followerCount', value: String(Math.max(0, formData.followerCount - 1)), type: 'number' } } as any)}
                          className="p-1 rounded-full hover:bg-purple-100 text-purple-600 transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          name="followerCount"
                          value={formData.followerCount} 
                          onChange={handleChange} 
                          className="w-full bg-transparent text-xl font-bold border-b border-purple-200 focus:border-purple-500 outline-none text-purple-900 text-center" 
                        />
                        <button 
                          type="button"
                          onClick={() => handleChange({ target: { name: 'followerCount', value: String(formData.followerCount + 1), type: 'number' } } as any)}
                          className="p-1 rounded-full hover:bg-purple-100 text-purple-600 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Ticket Types (includes Season Pass) */}
                {formData.ticketTypes?.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className={`p-4 rounded-2xl border ${
                      ticket.id === 'season' 
                        ? 'bg-gray-50 border-gray-100' 
                        : 'bg-blue-50/30 border-blue-100/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <label className={`${labelClasses} ${ticket.id === 'season' ? 'text-gray-500' : 'text-blue-600'}`}>
                        {ticket.name}
                      </label>
                      <span className={`text-xs font-bold ${ticket.id === 'season' ? 'text-gray-400' : 'text-blue-400'}`}>
                        Total: {ticket.leaderCount + ticket.followerCount}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`text-[10px] font-bold ${ticket.id === 'season' ? 'text-gray-400' : 'text-blue-400'} uppercase mb-1 block`}>Leader</label>
                        <div className="flex items-center space-x-2">
                          {ticket.id !== 'general' && (
                            <button 
                              type="button"
                              onClick={() => handleTicketTypeChange(ticket.id, 'leaderCount', Math.max(0, ticket.leaderCount - 1))}
                              className={`p-1 rounded-full transition-colors ${ticket.id === 'season' ? 'hover:bg-gray-200 text-gray-500' : 'hover:bg-blue-100 text-blue-600'}`}
                            >
                              <Minus size={14} />
                            </button>
                          )}
                          <input 
                            type="text" 
                            inputMode="numeric"
                            value={ticket.leaderCount} 
                            onChange={(e) => handleTicketTypeChange(ticket.id, 'leaderCount', e.target.value)} 
                            readOnly={ticket.id === 'general'}
                            className={`w-full bg-transparent text-xl font-bold border-b outline-none text-center ${
                              ticket.id === 'season' 
                                ? 'text-gray-800 border-gray-200 focus:border-blue-500' 
                                : ticket.id === 'general'
                                  ? 'text-gray-400 border-transparent cursor-not-allowed'
                                  : 'text-blue-900 border-blue-200 focus:border-blue-500'
                            }`} 
                          />
                          {ticket.id !== 'general' && (
                            <button 
                              type="button"
                              onClick={() => handleTicketTypeChange(ticket.id, 'leaderCount', ticket.leaderCount + 1)}
                              className={`p-1 rounded-full transition-colors ${ticket.id === 'season' ? 'hover:bg-gray-200 text-gray-500' : 'hover:bg-blue-100 text-blue-600'}`}
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className={`text-[10px] font-bold ${ticket.id === 'season' ? 'text-gray-400' : 'text-blue-400'} uppercase mb-1 block`}>Follower</label>
                        <div className="flex items-center space-x-2">
                          {ticket.id !== 'general' && (
                            <button 
                              type="button"
                              onClick={() => handleTicketTypeChange(ticket.id, 'followerCount', Math.max(0, ticket.followerCount - 1))}
                              className={`p-1 rounded-full transition-colors ${ticket.id === 'season' ? 'hover:bg-gray-200 text-gray-500' : 'hover:bg-blue-100 text-blue-600'}`}
                            >
                              <Minus size={14} />
                            </button>
                          )}
                          <input 
                            type="text" 
                            inputMode="numeric"
                            value={ticket.followerCount} 
                            onChange={(e) => handleTicketTypeChange(ticket.id, 'followerCount', e.target.value)} 
                            readOnly={ticket.id === 'general'}
                            className={`w-full bg-transparent text-xl font-bold border-b outline-none text-center ${
                              ticket.id === 'season' 
                                ? 'text-gray-800 border-gray-200 focus:border-blue-500' 
                                : ticket.id === 'general'
                                  ? 'text-gray-400 border-transparent cursor-not-allowed'
                                  : 'text-blue-900 border-blue-200 focus:border-blue-500'
                            }`} 
                          />
                          {ticket.id !== 'general' && (
                            <button 
                              type="button"
                              onClick={() => handleTicketTypeChange(ticket.id, 'followerCount', ticket.followerCount + 1)}
                              className={`p-1 rounded-full transition-colors ${ticket.id === 'season' ? 'hover:bg-gray-200 text-gray-500' : 'hover:bg-blue-100 text-blue-600'}`}
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Cash Inventory */}
          <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
            <div className="flex items-center space-x-2 text-emerald-600 mb-2">
              <DollarSign size={18} />
              <h3 className="font-bold uppercase tracking-widest text-xs">現金盤點 (Cash)</h3>
            </div>
            <div className="space-y-3">
              {[1000, 500, 100, 50, 10, 5, 1].map((denom) => (
                <div key={denom} className="flex items-center justify-between group">
                  <span className="text-sm font-bold text-gray-400 group-hover:text-gray-600 transition-colors">${denom}</span>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      inputMode="numeric"
                      name={`cash${denom}`} 
                      value={formData[`cash${denom}` as keyof typeof formData] as number} 
                      onChange={handleChange} 
                      className="w-20 px-2 py-1 bg-white border border-gray-200 rounded-lg text-right font-mono font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                    />
                    <span className="text-xs text-gray-400 w-4">張</span>
                  </div>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <label className={labelClasses}>備用金 (Starting Cash)</label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    inputMode="numeric"
                    name="startingCash" 
                    value={formData.startingCash} 
                    onChange={handleChange} 
                    className={`${inputClasses} pl-10 bg-white`} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <motion.div 
          layout
          className={`p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-500 ${
            formData.isBalanced 
              ? 'bg-emerald-50 border-2 border-emerald-100 shadow-lg shadow-emerald-100/50' 
              : 'bg-rose-50 border-2 border-rose-100 shadow-lg shadow-rose-100/50'
          }`}
        >
          <div className="flex items-center space-x-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${
              formData.isBalanced ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
              {formData.isBalanced ? <CheckCircle size={32} /> : <XCircle size={32} />}
            </div>
            <div className="space-y-1">
              <h4 className={`text-lg font-black ${formData.isBalanced ? 'text-emerald-900' : 'text-rose-900'}`}>
                {formData.isBalanced ? '帳目完全吻合！' : '帳目目前不符'}
              </h4>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <p className="text-sm font-medium text-gray-500">應收: <span className="text-gray-900 font-bold">${formData.expectedRevenue}</span></p>
                <p className="text-sm font-medium text-gray-500">實收: <span className="text-gray-900 font-bold">${formData.actualCash}</span></p>
              </div>
            </div>
          </div>
          <div className="text-center md:text-right bg-white/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">差額 (Difference)</p>
            <p className={`text-3xl font-black ${formData.isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>
              {(formData.actualCash - formData.expectedRevenue) >= 0 ? '+' : ''}${isNaN(formData.actualCash - formData.expectedRevenue) ? 0 : (formData.actualCash - formData.expectedRevenue)}
            </p>
          </div>
        </motion.div>

        <div className="flex justify-end space-x-4 pt-4">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-6 py-3 text-gray-500 font-bold hover:text-gray-700 hover:bg-gray-100 rounded-2xl transition-all"
          >
            取消 (Cancel)
          </button>
          <button 
            type="submit" 
            className="px-10 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl flex items-center shadow-xl shadow-gray-200 transition-all active:scale-95"
          >
            <Save className="mr-2" size={20} /> 儲存紀錄 (Save Record)
          </button>
        </div>
      </form>
    </motion.div>
  );
};
