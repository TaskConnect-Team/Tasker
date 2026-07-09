import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  DollarSign,
  Calendar,
  Send,
  Tag,
  MapPinCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios'; // Your axios instance
import AutoCompleteSelect from '../../components/ui/AutoCompleteSelect';
import { SHARED_SKILLS } from '../../constants/skills';
import { PAKISTAN_CITIES } from '../../constants/cities';
import LocationPicker from '../../components/common/LocationPicker';
import SingleAutoCompleteSelect from '../../components/ui/SingleAutoCompleteSelect';

const padDatePart = (value) => String(value).padStart(2, '0');

const formatLocalDateTime = (date, hour) => {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hours = padDatePart(hour);

  return `${year}-${month}-${day}T${hours}:00`;
};

const formatHourLabel = (hour) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:00 ${period}`;
};

const PostTaskPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [taskLocation, setTaskLocation] = useState(null);
  const [city, setCity] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    city: '',
    urgency: 'normal',
    scheduledAt: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextSevenDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() + index);
    day.setHours(0, 0, 0, 0);

    return day;
  });

  const hourSlots = Array.from({ length: 10 }, (_, index) => index + 9);

  useEffect(() => {
    if (!selectedDay || selectedHour === null) {
      return;
    }

    handleChange({
      target: {
        name: 'scheduledAt',
        value: formatLocalDateTime(selectedDay, selectedHour),
      },
    });
  }, [selectedDay, selectedHour]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Backend expects numbers for price
      const taskData = {
        ...formData,
        city: city,
        price: Number(formData.price),
        category: requiredSkills,
        lat: taskLocation?.lat,
        lng: taskLocation?.lng,
      };


      const response = await api.post('/tasks', taskData);
      toast.success('Task posted successfully!');
      navigate(`/tasks/${response.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <div className=" max-w-2xl ">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Post a New Task</h1>
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
              <div className="sm:col-span-2">
                <div className="mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <label className="block text-sm font-medium text-slate-700">Schedule Date</label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 shadow-inner">
                  <div className="flex flex-wrap justify-center gap-2 overflow-x-auto pb-1">
                    {nextSevenDays.map((day) => {
                      const isSelected = selectedDay?.toDateString() === day.toDateString();

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          onClick={() => setSelectedDay(day)}
                          className={`min-w-20 rounded-2xl border px-3 py-3 text-center transition-all duration-200 ${isSelected
                              ? 'border-primary bg-primary text-blue-500 shadow-lg shadow-primary/20'
                              : 'border-white bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary'
                            }`}
                        >
                          <span className={`block text-xs font-semibold ${isSelected ? 'text-blue-500' : 'text-slate-500'}`}>
                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <span className="mt-1 block text-2xl font-bold leading-none">
                            {day.getDate()}
                          </span>
                          <span className={`mt-1 block text-xs font-medium ${isSelected ? 'text-blue-500' : 'text-slate-500'}`}>
                            {day.toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {hourSlots.map((hour) => {
                      const isSelected = selectedHour === hour;

                      return (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => setSelectedHour(hour)}
                          className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${isSelected
                              ? 'border-primary bg-primary text-blue-500 shadow-md shadow-primary/20'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:bg-white hover:text-primary'
                            }`}
                        >
                          {formatHourLabel(hour)}
                        </button>
                      );
                    })}
                  </div>

                  {formData.scheduledAt && (
                    <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-medium text-slate-500">
                      Selected: {new Date(formData.scheduledAt).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>


                <div className="sm:col-span-1">
                  <div className="relative">

                    <SingleAutoCompleteSelect
                      label="City"
                      values={PAKISTAN_CITIES}
                      selectedValues={city}
                      onValueChange={setCity}
                      placeholder="e.g. Peshawar, Swabi..."
                    />

                  </div>
                </div>
              </div>

              {/* //  City is required to show map with exact location picker, as we need to set task coordinates for matching and map views. Once city is selected, we can show the location picker to set exact coordinates. For now, we can show location picker only when city is selected.  */}

              {city && (
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Pick Exact Location</label>
                  <LocationPicker onLocationSelect={setTaskLocation} city={city} />
                  <p className="mt-2 text-xs text-slate-500">
                    Move the marker to set the task coordinates used for matching and map views.
                  </p>
                </div>)
              }
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
