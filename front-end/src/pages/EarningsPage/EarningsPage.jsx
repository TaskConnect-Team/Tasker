import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

function EarningsPage() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState({});
  const [loading, setLoading] = useState(true);

  const role = user?.role ?? 'customer';

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const endpoint = role === 'tasker' ? '/tasks/tasker' : '/tasks/my';
        const { data } = await api.get(endpoint);
        console.log(data)
        setEarnings({});
      } catch (error) {
        console.log("error : ", error)
        setEarnings(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [role, user]);


  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Earnings</h1>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading earnings...
        </div>
      ) :
        earnings ? (<div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            Earning data featch but not rendered! 
          </div>
        </div>)
        : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No earnings data yet.
        </div>
      )}
    </section>
  );
}

export default EarningsPage;
