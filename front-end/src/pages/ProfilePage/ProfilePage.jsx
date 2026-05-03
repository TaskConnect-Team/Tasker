import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, MapPin, Loader2, BadgeCheck, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_IMAGE =
  'https://img.magnific.com/free-vector/user-circles-set_78370-4704.jpg?semt=ais_hybrid&w=740&q=80';

function Modal({ title, open, onClose, children }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeModal, setActiveModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialProfile = useMemo(
    () => ({
      profileImage: user?.profileImage || DEFAULT_IMAGE,
      tagline: user?.tagline || '',
      location: user?.location || '',
      bio: user?.bio || '',
      skills: (user?.skills || []).join(', '),
      services: (user?.services || []).join(', '),
      hourlyRate: user?.hourlyRate ?? '',
      portfolio: (user?.portfolio || []).join(', '),
    }),
    [user]
  );

  const [formState, setFormState] = useState(initialProfile);

  const openModal = (modalKey) => {
    setFormState(initialProfile);
    setActiveModal(modalKey);
  };

  const closeModal = () => setActiveModal(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (payload) => {
    setSaving(true);

    try {
      const { data } = await api.put('/users/profile', payload);
      updateUser(data.user);
      toast.success('Profile updated');
      closeModal();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const primaryButtonClasses =
    'inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white';

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={user?.profileImage || DEFAULT_IMAGE}
              alt="Profile"
              className="h-20 w-20 rounded-full object-cover"
            />
            <div>
              <p className="text-2xl font-semibold text-slate-900">{user?.name ?? 'TaskConnect'}</p>
              <p className="text-sm text-slate-500">{user?.tagline || 'Crafting trusted task matches'}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="h-4 w-4" />
                <span>{user?.location || 'Remote'}</span>
                {user?.isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] uppercase text-white">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openModal('hero')}
            className="rounded-full border border-slate-200 p-2 text-slate-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">About</h2>
            <p className="mt-2 text-sm text-slate-600">
              {user?.bio || 'Share your story and what makes your work stand out.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openModal('about')}
            className="rounded-full border border-slate-200 p-2 text-slate-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {user?.role === 'tasker' ? 'Professional Details' : 'Services'}
            </h2>
            <div className="mt-2 space-y-2 text-sm text-slate-600">
              {user?.role === 'tasker' ? (
                <div className="flex items-center gap-2 text-slate-900">
                  <DollarSign className="h-4 w-4" />
                  <span>{user?.hourlyRate ? `$${user.hourlyRate}/hr` : 'Set your hourly rate'}</span>
                </div>
              ) : null}
              <p>
                {(user?.role === 'tasker' ? user?.skills?.length : user?.services?.length)
                  ? [
                      ...(user?.role === 'tasker' ? user?.skills : []),
                      ...(user?.services || []),
                    ].filter(Boolean).join(', ')
                  : 'List what you offer so clients know what to expect.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openModal('professional')}
            className="rounded-full border border-slate-200 p-2 text-slate-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </section>

      <Modal
        title="Edit profile overview"
        open={activeModal === 'hero'}
        onClose={closeModal}
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Profile image URL
            <input
              name="profileImage"
              value={formState.profileImage}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Tagline
            <input
              name="tagline"
              value={formState.tagline}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Reliable tasker in your neighborhood"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Location
            <input
              name="location"
              value={formState.location}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="City, Country"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              handleSave({
                profileImage: formState.profileImage,
                tagline: formState.tagline,
                location: formState.location,
              })
            }
            className={primaryButtonClasses}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </Modal>

      <Modal title="Edit about" open={activeModal === 'about'} onClose={closeModal}>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Bio
            <textarea
              name="bio"
              value={formState.bio}
              onChange={handleChange}
              rows="4"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => handleSave({ bio: formState.bio })}
            className={primaryButtonClasses}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </Modal>

      <Modal
        title={user?.role === 'tasker' ? 'Edit professional details' : 'Edit services'}
        open={activeModal === 'professional'}
        onClose={closeModal}
      >
        <div className="space-y-4">
          {user?.role === 'tasker' ? (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Hourly rate (USD)
                <input
                  name="hourlyRate"
                  value={formState.hourlyRate}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="25"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Skills (comma separated)
                <input
                  name="skills"
                  value={formState.skills}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Electrical, Plumbing"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Portfolio links (comma separated)
                <input
                  name="portfolio"
                  value={formState.portfolio}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </label>
            </>
          ) : null}
          <label className="block text-sm font-medium text-slate-700">
            Services (comma separated)
            <input
              name="services"
              value={formState.services}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Cleaning, Delivery"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              handleSave({
                hourlyRate: user?.role === 'tasker' ? Number(formState.hourlyRate) : undefined,
                skills: user?.role === 'tasker' ? formState.skills : undefined,
                portfolio: user?.role === 'tasker' ? formState.portfolio : undefined,
                services: formState.services,
              })
            }
            className={primaryButtonClasses}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default ProfilePage;
