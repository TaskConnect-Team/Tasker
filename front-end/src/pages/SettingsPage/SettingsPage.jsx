
import {useNavigate} from 'react-router-dom';

function SettingsPage() {
  const navigate = useNavigate();
  return (
 
    <div className="container mx-auto px-4 py-8">
      <h1>Settings</h1>
      <p>This is where the settings content will go. It will allow you to update notifications, preferences, and <span className="font-semibold cursor-pointer" type="button" onClick={()=>navigate("/admin/", { replace: true })} >account</span> settings.</p>
    </div>
  );
}

export default SettingsPage;
