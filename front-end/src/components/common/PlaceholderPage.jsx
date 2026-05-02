import SectionTitle from './SectionTitle';

function PlaceholderPage({ title, subtitle }) {
  return (
    <section className="space-y-6">
      <SectionTitle title={title} subtitle={subtitle} />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          This section is ready for data once the backend endpoints are connected.
        </p>
      </div>
    </section>
  );
}

export default PlaceholderPage;
