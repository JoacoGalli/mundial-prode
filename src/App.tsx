import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { RequireAdmin, RequireAuth } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import MyPredictions from './pages/MyPredictions';
import Prizes from './pages/Prizes';
import Admin from './pages/Admin';
import HowItWorks from './pages/HowItWorks';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import GroupAdmin from './pages/GroupAdmin';
import JoinGroup from './pages/JoinGroup';
import { useAutoSyncResults } from './hooks/useAutoSyncResults';

function App() {
  useAutoSyncResults();

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
        <Route
          path="/como-se-puntua"
          element={
            <RequireAuth>
              <HowItWorks />
            </RequireAuth>
          }
        />
        <Route
          path="/groups"
          element={
            <RequireAuth>
              <Groups />
            </RequireAuth>
          }
        />
        <Route
          path="/groups/:groupId"
          element={
            <RequireAuth>
              <GroupDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/groups/:groupId/admin"
          element={
            <RequireAuth>
              <GroupAdmin />
            </RequireAuth>
          }
        />
        <Route
          path="/join/:inviteCode"
          element={
            <RequireAuth>
              <JoinGroup />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
