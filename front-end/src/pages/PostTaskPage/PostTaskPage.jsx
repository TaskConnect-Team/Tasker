
import React, { use, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  MapPin,
  DollarSign,
  Clock,
  AlertCircle,
  Calendar,
  Send,
  Building,
  Tag,
  MapPinCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios'; // Your axios instance
import AutoCompleteSelect from '../../components/ui/AutoCompleteSelect';
import { SHARED_SKILLS } from '../../constants/skills';

const PostTaskPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [requiredSkills, setRequiredSkills] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    city: '',
    location: '',
    urgency: 'normal',
    scheduledAt: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Backend expects numbers for price
      const taskData = {
        ...formData,
        price: Number(formData.price),
        category: requiredSkills
      };

      console.log("submitting task with data : ", taskData)

      const response = await api.post('/tasks', taskData);
      toast.success('Task posted successfully!');
      console.log("task created : ", response)
      navigate(`/tasks/${response.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Post a New Task</h1>
          <p className="mt-2 text-slate-600">Describe what you need help with and find the right tasker.</p>
        </div>

        <form className="space-y-6">
          {/* Section 1: Core Details */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
              <ClipboardList className="h-5 w-5 text-primary" />
              Task Essence
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Task Title</label>
                <input
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Fix leaking kitchen sink"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Detailed Description</label>
                <textarea
                  required
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Explain the task details, tools required, and any specific instructions..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section: Category Selection */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
              <Tag className="h-5 w-5 text-primary" />
              Task Category
            </div>

            <div>
              <AutoCompleteSelect
                label="Required Skills / Categories"
                values={SHARED_SKILLS}
                selectedValues={requiredSkills}
                onValueChange={setRequiredSkills}
                placeholder="e.g. Plumbing, Painting..."
              />
              <p className="mt-2 text-xs text-slate-500">
                This helps us match your task with the right experts.
              </p>
            </div>
          </div>

          {/* Section 2: Logistics */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
              <MapPinCheck className="h-5 w-5 text-primary" />
              Location & Timing
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">City</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    required
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g., Swabi"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Schedule Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    value={formData.scheduledAt}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Address / Location Details</label>
                <input
                  required
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Street name, Apartment #, Landmark..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Budget & Urgency */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
              <DollarSign className="h-5 w-5 text-primary" />
              Budget & Priority
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Estimated Budget ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    required
                    type="number"
                    min="1"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="50"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Urgency Level</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, urgency: 'normal' }))}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${formData.urgency === 'normal' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, urgency: 'urgent' }))}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${formData.urgency === 'urgent' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-red-500'}`}
                  >
                    Urgent
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div
            className='flex justify-center items-center'>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`group relative flex bg-indigo-300 hover:bg-indigo-500 transition-all px-2 items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-bold text-white shadow-lg shadow-primary/20  hover:bg-primary/90 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ' cursor-pointer'}`}
            >
              {loading ? (
                <div className="h-6 w-6 px-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  Post This Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostTaskPage;