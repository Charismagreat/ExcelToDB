'use client';

import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Save, 
  X,
  User as UserIcon,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Lock,
  Trash2,
  Loader2
} from 'lucide-react';
import { updateUserAction, createUserAction, deleteUserAction, getUsersAction } from '@/app/actions/user';
import { StatusModal } from './StatusModal';
import { UserBulkUploadModal } from './UserBulkUploadModal';
import { FileSpreadsheet } from 'lucide-react';

interface User {
  id: string;
  username: string;
  role: string;
  fullName: string | null;
  employeeId: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  password?: string;
  hasPassword?: boolean;
}

interface UserManagementTableProps {
  users: User[];
}

export function UserManagementTable({ users: initialUsers }: UserManagementTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    fullName: '',
    role: 'VIEWER',
    employeeId: '',
    password: ''
  });
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
  });

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditStart = (user: User) => {
    setEditingId(user.id);
    setEditFormData({ ...user });
  };

  const handleEditSave = async () => {
    if (!editingId || !editFormData) return;
    try {
      const result = await updateUserAction(editingId, editFormData);
      if (result.success) {
        setUsers(prev => prev.map(u => u.id === editingId ? { ...u, ...editFormData } as User : u));
        setEditingId(null);
        setModal({
          isOpen: true,
          title: '수정 완료',
          message: '사용자 정보가 성공적으로 업데이트되었습니다.',
          type: 'success'
        });
      }
    } catch (err: any) {
      setModal({
        isOpen: true,
        title: '수정 실패',
        message: err.message || '오류가 발생했습니다.',
        type: 'error'
      });
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUserData.username) throw new Error('아이디는 필수입니다.');
      if (!newUserData.password) throw new Error('초기 비밀번호를 입력해 주세요.');
      const result = await createUserAction(newUserData);
      if (result.success) {
        window.location.reload(); 
      }
    } catch (err: any) {
      setModal({
        isOpen: true,
        title: '생성 실패',
        message: err.message || '오류가 발생했습니다.',
        type: 'error'
      });
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`${user.fullName || user.username}님을 시스템에서 완전히 삭제하시겠습니까?`)) return;
    
    setIsDeleting(user.id);
    try {
      const result = await deleteUserAction(user.id);
      if (result.success) {
        setUsers(prev => prev.filter(u => u.id !== user.id));
        setModal({
          isOpen: true,
          title: '삭제 완료',
          message: '사용자가 시스템에서 성공적으로 삭제되었습니다.',
          type: 'success'
        });
      }
    } catch (err: any) {
      setModal({
        isOpen: true,
        title: '삭제 실패',
        message: err.message || '오류가 발생했습니다.',
        type: 'error'
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[10px] font-black border border-purple-100 uppercase tracking-wider"><ShieldAlert size={12} /> Admin</span>;
      case 'EDITOR':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black border border-blue-100 uppercase tracking-wider"><ShieldCheck size={12} /> Editor</span>;
      default:
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-[10px] font-black border border-gray-100 uppercase tracking-wider"><UserCheck size={12} /> Viewer</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="사용자 검색 (ID, 이름, 사번)..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 text-xs uppercase tracking-widest"
        >
          {isAdding ? <X size={16} /> : <UserPlus size={16} />}
          {isAdding ? '취소' : '신규 사용자 등록'}
        </button>
        
        <button 
          onClick={() => setShowBulkUpload(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 font-black rounded-2xl hover:bg-indigo-100 transition-all active:scale-95 text-xs uppercase tracking-widest border border-indigo-100"
        >
          <FileSpreadsheet size={16} />
          엑셀 일괄 등록
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[32px] border border-blue-100 shadow-2xl shadow-blue-500/5 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" />
            신규 시스템 사용자 등록
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">ID (Username)</label>
                <input 
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-sm"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Initial Password</label>
                <input 
                    type="password"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-sm"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                    placeholder="초기 비번 설정"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name</label>
                <input 
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-sm"
                    value={newUserData.fullName}
                    onChange={(e) => setNewUserData({...newUserData, fullName: e.target.value})}
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Employee ID (사번)</label>
                <input 
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-sm"
                    value={newUserData.employeeId}
                    onChange={(e) => setNewUserData({...newUserData, employeeId: e.target.value})}
                    placeholder="사번 입력 (선택)"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Role</label>
                <select 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-sm appearance-none cursor-pointer"
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                >
                    <option value="VIEWER">VIEWER</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="ADMIN">ADMIN</option>
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1">
                <button 
                    onClick={handleCreateUser}
                    className="w-full py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-xs uppercase"
                >
                    계정 생성하기
                </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-50">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
              <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Role</th>
              <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Last Access</th>
              <th className="px-8 py-5 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-blue-50/20 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                      <UserIcon size={20} />
                    </div>
                    <div>
                      {editingId === user.id ? (
                        <input 
                            type="text"
                            className="bg-blue-50 border-b-2 border-blue-500 outline-none px-1 font-bold text-sm text-blue-700"
                            value={editFormData.fullName || ''}
                            onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm font-bold text-gray-900">{user.fullName || '이름 없음'}</p>
                      )}
                      
                      {editingId === user.id ? (
                        <div className="mt-1">
                            <input 
                                type="text"
                                className="bg-blue-50 border-b border-blue-300 outline-none px-1 text-[10px] font-bold text-blue-600"
                                placeholder="사번 입력"
                                value={editFormData.employeeId || ''}
                                onChange={(e) => setEditFormData({...editFormData, employeeId: e.target.value})}
                            />
                        </div>
                      ) : (
                        user.employeeId && <p className="text-[10px] font-bold text-gray-500">직원 사번: {user.employeeId}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-gray-400">@{user.username}</p>
                        {!user.hasPassword && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black border border-amber-100 animate-pulse">
                                <ShieldAlert size={10} /> 비밀번호 미설정
                            </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  {editingId === user.id ? (
                    <select 
                        className="bg-blue-50 border-b-2 border-blue-500 outline-none text-xs font-black text-blue-700 py-1"
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                    >
                        <option value="VIEWER">VIEWER</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="ADMIN">ADMIN</option>
                    </select>
                  ) : (
                    getRoleBadge(user.role)
                  )}
                </td>
                <td className="px-8 py-5">
                   {editingId === user.id ? (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setEditFormData({...editFormData, isActive: true})}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${editFormData.isActive ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-100 text-gray-400'}`}
                            >
                                ACTIVE
                            </button>
                            <button 
                                onClick={() => setEditFormData({...editFormData, isActive: false})}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${!editFormData.isActive ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-gray-100 text-gray-400'}`}
                            >
                                DISABLED
                            </button>
                        </div>
                   ) : (
                        user.isActive ? (
                            <span className="flex items-center gap-1.5 text-green-600 font-bold text-xs"><CheckCircle2 size={14} /> 활성</span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-red-500 font-bold text-xs"><XCircle size={14} /> 중지</span>
                        )
                   )}
                </td>
                <td className="px-8 py-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-500 font-mono tracking-tight">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '기록 없음'}
                    </span>
                    {editingId === user.id && (
                        <div className="relative group/pw mt-1 animate-in slide-in-from-left-2">
                            <Lock size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-400" />
                            <input 
                                type="password"
                                className="w-full pl-6 pr-2 py-1 bg-blue-50 border-b border-blue-200 text-[10px] font-bold text-blue-700 outline-none focus:border-blue-500 placeholder:text-blue-300"
                                placeholder="비번 재설정 (비우면 유지)"
                                autoComplete="new-password"
                                value={editFormData.password || ''}
                                onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                            />
                        </div>
                    )}
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center justify-center gap-2">
                    {editingId === user.id ? (
                      <>
                        <button 
                          onClick={handleEditSave}
                          className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-90"
                        >
                          <Save size={16} />
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all active:scale-90"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleEditStart(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user)}
                          disabled={isDeleting === user.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90 disabled:opacity-50"
                        >
                          {isDeleting === user.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.isOpen && (
        <StatusModal
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        />
      )}

      {showBulkUpload && (
        <UserBulkUploadModal 
          onClose={() => setShowBulkUpload(false)}
          onSuccess={async () => {
             try {
                const updatedUsers = await getUsersAction();
                setUsers(updatedUsers);
             } catch (err) {
                console.error('Failed to refresh users:', err);
             }
          }}
        />
      )}
    </div>
  );
}

