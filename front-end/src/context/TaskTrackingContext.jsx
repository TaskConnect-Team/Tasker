
import { createContext, useContext, useState, useEffect } from 'react';
import useTaskerLocation from '../hooks/useTaskerLocation';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const TaskTrackingContext = createContext();

export function TaskTrackingProvider({ children }) {

    
    const { user } = useAuth();
    const [activeTask, setActiveTask] = useState(null);
    
    // Formulate destination coordinates if an active task exists
    const destinationCoordinates = activeTask?.location?.coordinates ? {
        lat: activeTask.location.coordinates[1],
        lng: activeTask.location.coordinates[0]
    } : null;   
    
    
    // The hook remains mounted globally. It only activates when activeTask exists.
    const { permissionBlocked, setPermissionBlocked } = useTaskerLocation(
        activeTask?._id,
        destinationCoordinates,
        user?.id || user?._id, // Adapt to your exact user ID key
        !!activeTask // isActive boolean triggers the hardware watch
    );

    // Restore tracking on hard page reloads
    useEffect(() => {
        if (user?.role !== 'tasker') return;

        const checkActiveTask = async () => {
            try {
                // Fetch tasks and look for any currently 'in-progress'
                const { data } = await api.get('/tasks/tasker');
                
                const inProgressTask = data.find(t => t.status === 'in-progress');
                if (inProgressTask) {
                    setActiveTask(inProgressTask);
                }
            } catch (error) {
                console.error("Failed to recover active tracking session:", error);
            }
        };
        
        checkActiveTask();
    }, [user]);
    
    const startTracking = (task) => setActiveTask(task);
    const stopTracking = () => setActiveTask(null);

    return (
        <TaskTrackingContext.Provider value={{
            activeTask,
            startTracking,
            stopTracking,
            permissionBlocked,
            setPermissionBlocked
        }}>
            {children}
        </TaskTrackingContext.Provider>
    );
}

export const useTaskTracking = () => useContext(TaskTrackingContext);