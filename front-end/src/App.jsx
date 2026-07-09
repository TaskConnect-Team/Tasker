import AppRouter from "./routes/AppRouter"
import { AuthProvider } from "./context/AuthContext";
import { TaskTrackingProvider } from "./context/TaskTrackingContext";


function App() {
  return (
    <AuthProvider>
      <TaskTrackingProvider>
        <AppRouter/>
      </TaskTrackingProvider>
    </AuthProvider>
  )
}

export default App
