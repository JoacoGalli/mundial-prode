import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { RequireAdmin, RequireAuth } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import MyPredictions from './pages/MyPredictions';
import Prizes from './pages/Prizes';
import Admin from './pages/Admin';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/matches"
          element={
            <RequireAuth>
              <Matches />
            </RequireAuth>
          }
        />
        <Route
          path="/predictions"
          element={
            <RequireAuth>
              <MyPredictions />
            </RequireAuth>
          }
        />
        <Route
          path="/prizes"
          element={
            <RequireAuth>
              <Prizes />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
