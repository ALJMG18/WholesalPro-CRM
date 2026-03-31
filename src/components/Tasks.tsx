import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Task } from '../types';
import { Plus, CheckCircle2, Circle, Clock, Trash2, Calendar, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Timestamp } from 'firebase/firestore';

import { cn } from '../lib/utils';

interface TasksProps {
  user: User;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

const handleFirestoreError = (error: any, operationType: OperationType, path: string | null) => {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo, null, 2));
  return errInfo;
};

export default function Tasks({ user }: TasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const checkTasks = () => {
      const now = new Date();
      tasks.forEach(async (task) => {
        if (!task.completed && !task.notified && task.dueDate) {
          let taskDate: Date;
          if (task.dueDate instanceof Timestamp) {
            taskDate = task.dueDate.toDate();
          } else if (task.dueDate?.seconds) {
            taskDate = new Date(task.dueDate.seconds * 1000);
          } else {
            taskDate = new Date(task.dueDate);
          }

          if (task.dueTime) {
            const [hours, minutes] = task.dueTime.split(':').map(Number);
            taskDate.setHours(hours, minutes, 0, 0);
          } else {
            // If no time, default to start of day or just ignore time check
            taskDate.setHours(0, 0, 0, 0);
          }

          if (now >= taskDate) {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("WholesalePro Reminder", {
                body: task.title,
                icon: "/favicon.ico"
              });
            }
            try {
              await updateDoc(doc(db, 'tasks', task.id), { notified: true });
            } catch (e) {
              console.error("Error updating notified status", e);
            }
          }
        }
      });
    };

    const interval = setInterval(checkTasks, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    const q = query(
      collection(db, 'tasks'),
      where('ownerUid', '==', user.uid),
      orderBy('dueDate', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const taskDate = new Date(newDate);
      // Ensure it's a valid date
      if (isNaN(taskDate.getTime())) {
        throw new Error("Invalid date");
      }

      await addDoc(collection(db, 'tasks'), {
        title: newTask,
        completed: false,
        leadId: 'general',
        ownerUid: user.uid,
        dueDate: Timestamp.fromDate(taskDate),
        dueTime: newTime || null,
        notified: false,
        createdAt: serverTimestamp()
      });
      setNewTask('');
      setNewTime('');
    } catch (error) {
      console.error("Error adding task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        completed: !task.completed
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-zinc-500 text-sm">Keep track of your follow-ups and deal deadlines</p>
      </div>

      <form onSubmit={handleAddTask} className="space-y-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Add a new follow-up task..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button 
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all",
              isSubmitting && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <Plus size={20} />
            )}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[150px] relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input 
              type="date"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[120px] relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input 
              type="time"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-[10px] text-zinc-500 uppercase tracking-wider">
            <Bell size={12} className={cn(Notification.permission === 'granted' ? "text-emerald-500" : "text-zinc-600")} />
            {Notification.permission === 'granted' ? 'Alerts On' : 'Alerts Off'}
          </div>
        </div>
      </form>

      <div className="space-y-3">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div 
              key={task.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={cn(
                "group flex items-center gap-4 p-4 rounded-2xl border transition-all",
                task.completed 
                  ? "bg-zinc-900/30 border-zinc-900 text-zinc-600" 
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:border-zinc-700"
              )}
            >
              <button 
                onClick={() => toggleTask(task)}
                className={cn(
                  "transition-colors",
                  task.completed ? "text-emerald-500" : "text-zinc-600 hover:text-zinc-400"
                )}
              >
                {task.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  task.completed && "line-through"
                )}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider mt-1 opacity-60">
                  <Calendar size={10} />
                  <span>
                    {task.dueDate ? (
                      task.dueDate instanceof Timestamp 
                        ? task.dueDate.toDate().toLocaleDateString() 
                        : new Date(task.dueDate?.seconds ? task.dueDate.seconds * 1000 : task.dueDate).toLocaleDateString()
                    ) : 'No date'}
                    {task.dueTime && ` at ${task.dueTime}`}
                  </span>
                  {task.dueTime && !task.completed && (
                    <div className="flex items-center gap-1 ml-2 text-emerald-500">
                      <Bell size={10} />
                      <span>Reminder Set</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {deleteConfirmId === task.id ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                    <button 
                      onClick={() => {
                        deleteTask(task.id);
                        setDeleteConfirmId(null);
                      }}
                      className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition-all"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(null)}
                      className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setDeleteConfirmId(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {tasks.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-700">
              <CheckSquare size={32} />
            </div>
            <p className="text-zinc-500 text-sm italic">All caught up! No pending tasks.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Tasks component

import { CheckSquare } from 'lucide-react';
