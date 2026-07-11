import React, { useState, useCallback } from "react";
import { Search, AlertCircle } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

/**
 * AdminLayout
 * Main layout wrapper for admin pages
 * Includes sidebar and "God Mode" search bar
 */
const AdminLayout = ({ children }) => {
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(async (e) => {
    const query = e.target.value.trim();

    if (query.length < 2) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/admin/search?q=${encodeURIComponent(query)}`,
        {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        {/* Top Header with Search */}
        <div className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900 hidden md:block">
              Admin Dashboard
            </h2>

            {/* God Mode Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users, tasks, emails..."
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  {(searchResults.users?.length > 0 || searchResults.tasks?.length > 0) ? (
                    <>
                      {/* Users Section */}
                      {searchResults.users?.length > 0 && (
                        <div className="border-b border-gray-200">
                          <p className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 uppercase">
                            Users
                          </p>
                          {searchResults.users.map((user) => (
                            <div
                              key={user._id}
                              className="px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                            >
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                              <span
                                className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                                  user.role === "tasker"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {user.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tasks Section */}
                      {searchResults.tasks?.length > 0 && (
                        <div>
                          <p className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 uppercase">
                            Tasks
                          </p>
                          {searchResults.tasks.map((task) => (
                            <div
                              key={task._id}
                              className="px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                            >
                              <p className="font-medium text-gray-900">{task.title}</p>
                              <p className="text-sm text-gray-500">
                                Rs. {task.price} · {task.status}
                              </p>
                              <span
                                className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                                  task.urgency === "urgent"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {task.urgency}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-500 flex flex-col items-center gap-2">
                      <AlertCircle size={20} />
                      <p>No results found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
