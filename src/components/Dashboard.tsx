import React, { useState } from 'react';
import { useRecords } from '../hooks/useRecords';
import { useSettings } from '../hooks/useSettings';
import { RecordForm } from './RecordForm';
import { AccountingRecord, UserSettings } from '../types';
import { Plus, Minus, Edit2, Trash2, LogOut, CheckCircle, XCircle, AlertTriangle, Settings, Save } from 'lucide-react';
import { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  user: User;
  onSignOut: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const { records, loading: recordsLoading, addRecord, updateRecord, deleteRecord } = useRecords(user);
  const { settings, loading: settingsLoading, updateSettings } = useSettings(user);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AccountingRecord | undefined>(undefined);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [tempSettings, setTempSettings] = useState<Partial<UserSettings>>({});

  const loading = recordsLoading || settingsLoading;

  const handleSave = async (record: Omit<AccountingRecord, 'id'>) => {
    try {
      if (editingRecord?.id) {
        await updateRecord(editingRecord.id, record);
      } else {
        await addRecord(record);
      }
      setIsFormOpen(false);
      setEditingRecord(undefined);
    } catch (error) {
      console.error("Failed to save record:", error);
      setErrorMsg("儲存失敗，請檢查控制台 (Failed to save record. Please check console.)");
    }
  };

  const handleEdit = (record: AccountingRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setRecordToDelete(id);
  };

  const confirmDelete = async () => {
    if (recordToDelete) {
      try {
        await deleteRecord(recordToDelete);
        setRecordToDelete(null);
      } catch (error) {
        console.error("Failed to delete record:", error);
        setErrorMsg("刪除失敗 (Failed to delete record.)");
        setRecordToDelete(null);
      }
    }
  };

  const cancelDelete = () => {
    setRecordToDelete(null);
  };

  const openSettings = () => {
    if (settings) {
      setTempSettings({
        defaultGeneralPrice: settings.defaultGeneralPrice,
        defaultStudentPrice: settings.defaultStudentPrice,
        defaultStartingCash: settings.defaultStartingCash,
      });
    }
    setIsSettingsOpen(true);
  };

  const handleSettingsSave = async () => {
    try {
      await updateSettings(tempSettings);
      setIsSettingsOpen(false);
    } catch (error) {
      setErrorMsg("儲存設定失敗 (Failed to save settings.)");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">舞會櫃台對帳 (Dance Party Accounting)</h1>
            <p className="text-sm text-gray-500">Logged in as {user.email}</p>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button 
              onClick={openSettings}
              className="flex-1 sm:flex-none flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors px-4 py-2.5 rounded-xl hover:bg-blue-50 border border-gray-100"
            >
              <Settings size={20} className="mr-2" />
              設定 (Settings)
            </button>
            <button 
              onClick={onSignOut}
              className="flex-1 sm:flex-none flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors px-4 py-2.5 rounded-xl hover:bg-red-50 border border-gray-100"
            >
              <LogOut size={20} className="mr-2" />
              登出 (Sign Out)
            </button>
          </div>
        </header>

        {isFormOpen ? (
          <RecordForm 
            initialData={editingRecord} 
            onSave={handleSave} 
            onCancel={() => {
              setIsFormOpen(false);
              setEditingRecord(undefined);
            }} 
            userId={user.uid}
            defaultGeneralPrice={settings?.defaultGeneralPrice}
            defaultStudentPrice={settings?.defaultStudentPrice}
            defaultStartingCash={settings?.defaultStartingCash}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-700">歷史紀錄 (History)</h2>
              <button 
                onClick={() => setIsFormOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm"
              >
                <Plus size={20} className="mr-2" />
                新增記帳 (New Record)
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">載入中 (Loading...)</div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-500">
                目前沒有記帳紀錄 (No records found).
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {records.map(record => (
                  <div key={record.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">{record.eventName}</h3>
                        <p className="text-sm text-gray-500">{record.date}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleEdit(record)} className="text-gray-400 hover:text-blue-600 transition-colors p-1">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteClick(record.id!)} className="text-gray-400 hover:text-red-600 transition-colors p-1">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>總人數 (Total Attendees):</span>
                        <span className="font-medium">{record.leaderCount + record.followerCount}</span>
                      </div>
                      {record.ticketTypes && record.ticketTypes.length > 0 ? (
                        <div className="pt-2 border-t border-gray-50 mt-2 space-y-1">
                          {record.ticketTypes.map(ticket => (
                            (ticket.leaderCount > 0 || ticket.followerCount > 0) && (
                              <div 
                                key={ticket.id} 
                                className={`flex justify-between text-xs italic ${
                                  ticket.id === 'season' ? 'text-gray-400' : 'text-gray-500'
                                }`}
                              >
                                <span>{ticket.name}:</span>
                                <span>L:{ticket.leaderCount ?? 0} F:{ticket.followerCount ?? 0} {ticket.id !== 'season' && `(${( (ticket.leaderCount ?? 0) + (ticket.followerCount ?? 0) ) * (ticket.price ?? 0)})`}</span>
                              </div>
                            )
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span>季票 (Season) / 學生 (Student):</span>
                          <span className="font-medium">{record.seasonPassCount} / {record.studentPassCount}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span>應收 (Expected):</span>
                        <span className="font-medium">${record.expectedRevenue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>實收 (Actual):</span>
                        <span className="font-medium">${record.actualCash}</span>
                      </div>
                    </div>

                    <div className={`flex items-center justify-center p-2 rounded-lg ${record.isBalanced ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {record.isBalanced ? (
                        <><CheckCircle size={18} className="mr-2" /> 帳目吻合 (Balanced)</>
                      ) : (
                        <><XCircle size={18} className="mr-2" /> 差額 (Diff): ${record.actualCash - record.expectedRevenue}</>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Modal */}
        <AnimatePresence>
          {isSettingsOpen && (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSettingsOpen(false)}
                className="absolute inset-0 bg-gray-900/20 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-white/50"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Settings size={24} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">全域設定 (Global Settings)</h3>
                </div>
                
                <div className="space-y-6 mb-8">
                  <p className="text-sm text-gray-500">在此設定預設票價，新紀錄將自動套用這些數值。</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">預設一般票價 (Default General Price)</label>
                      <div className="flex items-center space-x-2">
                        <button 
                          type="button"
                          onClick={() => setTempSettings(prev => ({ ...prev, defaultGeneralPrice: Math.max(0, (prev.defaultGeneralPrice ?? 0) - 50) }))}
                          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <Minus size={18} />
                        </button>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={tempSettings.defaultGeneralPrice ?? 0} 
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
                            setTempSettings(prev => ({ ...prev, defaultGeneralPrice: val === '' ? 0 : parseInt(val, 10) }));
                          }}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-gray-700 text-center"
                        />
                        <button 
                          type="button"
                          onClick={() => setTempSettings(prev => ({ ...prev, defaultGeneralPrice: (prev.defaultGeneralPrice ?? 0) + 50 }))}
                          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">預設學生票價 (Default Student Price)</label>
                      <div className="flex items-center space-x-2">
                        <button 
                          type="button"
                          onClick={() => setTempSettings(prev => ({ ...prev, defaultStudentPrice: Math.max(0, (prev.defaultStudentPrice ?? 0) - 50) }))}
                          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <Minus size={18} />
                        </button>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={tempSettings.defaultStudentPrice ?? 0} 
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
                            setTempSettings(prev => ({ ...prev, defaultStudentPrice: val === '' ? 0 : parseInt(val, 10) }));
                          }}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-gray-700 text-center"
                        />
                        <button 
                          type="button"
                          onClick={() => setTempSettings(prev => ({ ...prev, defaultStudentPrice: (prev.defaultStudentPrice ?? 0) + 50 }))}
                          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">預設備用金 (Default Starting Cash)</label>
                      <div className="flex items-center space-x-2">
                        <button 
                          type="button"
                          onClick={() => setTempSettings(prev => ({ ...prev, defaultStartingCash: Math.max(0, (prev.defaultStartingCash ?? 0) - 100) }))}
                          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <Minus size={18} />
                        </button>
                        <input 
                          type="text" 
                          inputMode="numeric"
                          value={tempSettings.defaultStartingCash ?? 0} 
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
                            setTempSettings(prev => ({ ...prev, defaultStartingCash: val === '' ? 0 : parseInt(val, 10) }));
                          }}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-gray-700 text-center"
                        />
                        <button 
                          type="button"
                          onClick={() => setTempSettings(prev => ({ ...prev, defaultStartingCash: (prev.defaultStartingCash ?? 0) + 100 }))}
                          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="flex-1 px-4 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-all"
                  >
                    取消 (Cancel)
                  </button>
                  <button 
                    onClick={handleSettingsSave}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transition-all active:scale-95"
                  >
                    <Save className="mr-2" size={20} /> 儲存 (Save)
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {recordToDelete && (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={cancelDelete}
                className="absolute inset-0 bg-gray-900/20 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative z-10 border border-white/50"
              >
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">確認刪除 (Confirm Delete)</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  確定要刪除這筆記帳嗎？此動作無法復原。
                  <span className="block text-sm mt-1 opacity-70">(Are you sure you want to delete this record? This action cannot be undone.)</span>
                </p>
                <div className="flex space-x-3">
                  <button 
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    取消 (Cancel)
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-200"
                  >
                    刪除 (Delete)
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Error Message Modal */}
        <AnimatePresence>
          {errorMsg && (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setErrorMsg(null)}
                className="absolute inset-0 bg-gray-900/20 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative z-10 border-t-4 border-red-500"
              >
                <div className="flex items-center mb-4 text-red-600">
                  <XCircle size={28} className="mr-3" />
                  <h3 className="text-xl font-bold">錯誤 (Error)</h3>
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">{errorMsg}</p>
                <button 
                  onClick={() => setErrorMsg(null)}
                  className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-colors"
                >
                  關閉 (Close)
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
