import { useState } from 'react';
import type { CampId } from './types/database';
import { AppProvider, useAppData } from './context/AppContext';
import { isSupabaseConfigured } from './lib/supabase';
import { LoginPage } from './pages/LoginPage';
import {
  PR, MUT, BLU, ORA, CAMP_NAMES, NAV_SECTIONS, TAB_LABELS, sectionForTab,
  isStaffSubTab,
  type MainTab, type NavSectionId,
} from './constants';
import { KotTab } from './tabs/KotTab';
import { AnalysisTab } from './tabs/AnalysisTab';
import { SummaryTab } from './tabs/SummaryTab';
import { FoodCostTab } from './tabs/FoodCostTab';
import { StaffTab } from './tabs/StaffTab';
import { GuestsTab } from './tabs/GuestsTab';
import { ComplaintsTab } from './tabs/ComplaintsTab';
import { ReportsTab } from './tabs/ReportsTab';
import { ManageTab } from './tabs/ManageTab';

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { guests, staff } = useAppData();
  const [section, setSection] = useState<NavSectionId>('kitchen');
  const [tab, setTab] = useState<MainTab>('kot');
  const [view, setView] = useState('all');
  const [fk, setFk] = useState('');
  const campGuests = guests.guests;
  const pendingLeaves = staff.leaveRecords.filter((l) => l.status === 'pending').length;
  const inHouseCount = campGuests.filter((g) => g.status === 'in-house').length;

  const activeSection = NAV_SECTIONS.find((s) => s.id === section) ?? NAV_SECTIONS[0];

  function selectSection(next: NavSectionId) {
    setSection(next);
    const first = NAV_SECTIONS.find((s) => s.id === next)?.tabs[0]?.[0];
    if (first) setTab(first);
  }

  function selectTab(next: MainTab) {
    setTab(next);
    setSection(sectionForTab(next));
  }

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
            <button
              key={s.id}
              type="button"
              className={'nav-section' + (section === s.id ? ' active' : '')}
              onClick={() => selectSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="tab-bar nav-tabs">
          {activeSection.tabs.map(([k, l]) => (
            <button key={k} type="button" className={'tab' + (tab === k ? ' active' : '')} onClick={() => selectTab(k)}>
              {TAB_LABELS[k as MainTab] ?? l}
              {tabBadge(k as MainTab)}
            </button>
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
  const [camp, setCamp] = useState<CampId>('jawai');

  return (
    <>
      {!isSupabaseConfigured && (
        <div className="supabase-banner">
          Supabase not configured — copy <code>.env.example</code> to <code>.env.local</code> and add your project credentials.
        </div>
      )}
      <div style={{ background: '#fff', borderBottom: '1px solid #d9cdb8', padding: '0 26px', display: 'flex' }}>
        {(['jawai', 'sherbagh', 'serai'] as CampId[]).map((k) => (
          <button
            key={k}
            onClick={() => setCamp(k)}
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
            }}
          >
            {CAMP_NAMES[k]}
          </button>
        ))}
      </div>
      <AppProvider campId={camp} key={camp}>
        <Dashboard onLogout={onLogout} />
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

export default function App() {
  const [authed, setAuthed] = useState(isSignedIn);

  function handleLogout() {
    signOut();
    setAuthed(false);
  }

  if (!authed) {
    return (
      <LoginPage
        onLogin={() => {
          signIn();
          setAuthed(true);
        }}
      />
    );
  }

  return <CampShell onLogout={handleLogout} />;
}
