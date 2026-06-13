import { useState } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import type { CampId } from './types/database';
import { AppProvider, useAppData } from './context/AppContext';
import { isSupabaseConfigured } from './lib/supabase';
import { LoginPage } from './pages/LoginPage';
import {
  PR, MUT, BLU, ORA, CAMP_NAMES, NAV_SECTIONS, TAB_LABELS, sectionForTab,
  isStaffSubTab,
  type MainTab, type NavSectionId,
} from './constants';
import {
  CAMPS,
  campTabPath,
  DEFAULT_CAMP,
  DEFAULT_PATH,
  firstTabInSection,
  isCampId,
  isMainTab,
} from './routes';
import { KotTab } from './tabs/KotTab';
import { AnalysisTab } from './tabs/AnalysisTab';
import { SummaryTab } from './tabs/SummaryTab';
import { FoodCostTab } from './tabs/FoodCostTab';
import { StaffTab } from './tabs/StaffTab';
import { GuestsTab } from './tabs/GuestsTab';
import { ComplaintsTab } from './tabs/ComplaintsTab';
import { ReportsTab } from './tabs/ReportsTab';
import { ManageTab } from './tabs/ManageTab';

function Dashboard({ camp, tab, onLogout }: { camp: CampId; tab: MainTab; onLogout: () => void }) {
  const { guests, staff } = useAppData();
  const [view, setView] = useState('all');
  const [fk, setFk] = useState('');
  const campGuests = guests.guests;
  const pendingLeaves = staff.leaveRecords.filter((l) => l.status === 'pending').length;
  const inHouseCount = campGuests.filter((g) => g.status === 'in-house').length;

  const section = sectionForTab(tab);
  const activeSection = NAV_SECTIONS.find((s) => s.id === section) ?? NAV_SECTIONS[0];

  function tabBadge(k: MainTab) {
    if (k === 'guests' && inHouseCount > 0) {
      return (
        <span style={{ background: BLU, color: '#fff', borderRadius: '50%', padding: '0 4px', fontSize: 9, marginLeft: 3 }}>
          {inHouseCount}
        </span>
      );
    }
    if (k === 'staff-leaves' && pendingLeaves > 0) {
      return (
        <span style={{ background: ORA, color: '#fff', borderRadius: '50%', padding: '0 4px', fontSize: 9, marginLeft: 3 }}>
          {pendingLeaves}
        </span>
      );
    }
    return null;
  }

  return (
    <div style={{ fontFamily: "'EB Garamond',Georgia,serif", background: '#f7f4f0', minHeight: '100vh' }}>
      <div className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo">SUJÁN</span>
          <span className="app-header__subtitle">Kitchen Dashboard</span>
        </div>
        <button type="button" className="logout-btn" onClick={onLogout}>
          Log out
        </button>
      </div>

      <div className="nav-shell">
        <div className="nav-sections">
          {NAV_SECTIONS.map((s) => (
            <NavLink
              key={s.id}
              to={campTabPath(camp, firstTabInSection(s.id as NavSectionId))}
              className={({ isActive }) => 'nav-section' + (isActive || section === s.id ? ' active' : '')}
            >
              {s.label}
            </NavLink>
          ))}
        </div>
        <div className="tab-bar nav-tabs">
          {activeSection.tabs.map(([k, l]) => (
            <NavLink
              key={k}
              to={campTabPath(camp, k as MainTab)}
              className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}
            >
              {TAB_LABELS[k as MainTab] ?? l}
              {tabBadge(k as MainTab)}
            </NavLink>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 26px', maxWidth: 1300, margin: '0 auto' }}>
        {tab === 'kot' && <KotTab />}
        {tab === 'analysis' && <AnalysisTab view={view} fk={fk} setView={setView} setFk={setFk} />}
        {tab === 'summary' && <SummaryTab view={view} fk={fk} />}
        {tab === 'foodcost' && <FoodCostTab />}
        {isStaffSubTab(tab) && <StaffTab activeTab={tab} />}
        {tab === 'guests' && <GuestsTab />}
        {tab === 'complaints' && <ComplaintsTab />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'manage' && <ManageTab />}
      </div>
    </div>
  );
}

function CampShell({ onLogout }: { onLogout: () => void }) {
  const { camp: campParam, tab: tabParam } = useParams();

  if (!campParam || !tabParam || !isCampId(campParam) || !isMainTab(tabParam)) {
    return <Navigate to={DEFAULT_PATH} replace />;
  }

  const camp = campParam;
  const tab = tabParam;

  return (
    <>
      {!isSupabaseConfigured && (
        <div className="supabase-banner">
          Supabase not configured — copy <code>.env.example</code> to <code>.env.local</code> and add your project credentials.
        </div>
      )}
      <div style={{ background: '#fff', borderBottom: '1px solid #d9cdb8', padding: '0 26px', display: 'flex' }}>
        {CAMPS.map((k) => (
          <Link
            key={k}
            to={campTabPath(k, tab)}
            className={'camp-tab' + (camp === k ? ' active' : '')}
            style={{
              fontFamily: "'EB Garamond',Georgia,serif",
              fontSize: 14,
              padding: '11px 20px',
              border: 'none',
              background: 'none',
              borderBottom: camp === k ? '3px solid ' + PR : '3px solid transparent',
              color: camp === k ? PR : MUT,
              cursor: 'pointer',
              marginBottom: -1,
              letterSpacing: '0.05em',
              textDecoration: 'none',
            }}
          >
            {CAMP_NAMES[k]}
          </Link>
        ))}
      </div>
      <AppProvider campId={camp} key={camp}>
        <Dashboard camp={camp} tab={tab} onLogout={onLogout} />
      </AppProvider>
    </>
  );
}

const AUTH_KEY = 'sujan_kitchen_auth';

function signIn() {
  sessionStorage.setItem(AUTH_KEY, '1');
}

function isSignedIn() {
  return sessionStorage.getItem(AUTH_KEY) === '1';
}

function signOut() {
  sessionStorage.removeItem(AUTH_KEY);
}

function LoginRoute({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : DEFAULT_PATH;

  if (isSignedIn()) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <LoginPage
      onLogin={() => {
        signIn();
        onLogin();
        navigate(redirectTo, { replace: true });
      }}
    />
  );
}

function RequireAuth({ authed, children }: { authed: boolean; children: React.ReactNode }) {
  const location = useLocation();
  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export default function App() {
  const [authed, setAuthed] = useState(isSignedIn);

  function handleLogout() {
    signOut();
    setAuthed(false);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute onLogin={() => setAuthed(true)} />} />
        <Route
          path="/"
          element={
            <RequireAuth authed={authed}>
              <Navigate to={DEFAULT_PATH} replace />
            </RequireAuth>
          }
        />
        <Route
          path="/:camp"
          element={
            <RequireAuth authed={authed}>
              <CampRedirect />
            </RequireAuth>
          }
        />
        <Route
          path="/:camp/:tab"
          element={
            <RequireAuth authed={authed}>
              <CampShell onLogout={handleLogout} />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to={authed ? DEFAULT_PATH : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function CampRedirect() {
  const { camp: campParam } = useParams();
  if (!campParam || !isCampId(campParam)) {
    return <Navigate to={campTabPath(DEFAULT_CAMP, 'kot')} replace />;
  }
  return <Navigate to={campTabPath(campParam, 'kot')} replace />;
}
