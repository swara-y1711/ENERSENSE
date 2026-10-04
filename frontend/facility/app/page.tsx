'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import FacilityManagerDashboard from './components/FacilityManagerDashboard';
import OccupantDashboard from './components/OccupantDashboard';
import { getReplayStatus } from './lib/api';
import { OccupantProfile } from './data/facilityData';

type AccountRole = 'manager' | 'occupant';
type Screen = 'welcome' | 'manager-form' | 'occupant-form' | 'dashboard';

interface ManagerProfile {
  name: string;
  workEmail: string;
  managerId: string;
  facility: string;
  phone: string;
}

interface StoredSession {
  role: AccountRole;
  manager: ManagerProfile | null;
  occupant: OccupantProfile | null;
}

const SESSION_KEY = 'enersense.mvp.session';

function isManagerProfile(value: unknown): value is ManagerProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Record<string, unknown>;
  return ['name', 'workEmail', 'managerId', 'facility', 'phone'].every(
    (key) => typeof profile[key] === 'string',
  );
}

function isOccupantProfile(value: unknown): value is OccupantProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Record<string, unknown>;
  return ['name', 'email', 'phone', 'building', 'flatNumber'].every(
    (key) => typeof profile[key] === 'string',
  );
}

function readStoredSession(): StoredSession | null {
  const stored = window.localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    const value: unknown = JSON.parse(stored);
    if (!value || typeof value !== 'object') return null;
    const session = value as Record<string, unknown>;
    if (session.role !== 'manager' && session.role !== 'occupant') return null;
    const manager = isManagerProfile(session.manager) ? session.manager : null;
    const occupant = isOccupantProfile(session.occupant) ? session.occupant : null;
    if (session.role === 'manager' && !manager) return null;
    if (session.role === 'occupant' && !occupant) return null;
    return { role: session.role, manager, occupant };
  } catch {
    return null;
  }
}

function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${inverse ? 'bg-white text-primary' : 'bg-on-surface text-primary'}`}>
        ⚡
      </div>
      <span className={`text-xl font-bold tracking-tight ${inverse ? 'text-white' : 'text-on-surface'}`}>
        ENER<span className={inverse ? 'text-emerald-300' : 'text-primary'}>SENSE</span>
      </span>
    </div>
  );
}

function WelcomeScreen({
  onContinue,
}: {
  onContinue: (role: AccountRole) => void;
}) {
  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:px-8 sm:py-12 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        <header className="flex justify-center mb-10 sm:mb-14">
          <Logo />
        </header>
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Building energy intelligence
          </span>
          <h1 className="mt-5 text-3xl sm:text-5xl font-bold tracking-tight text-on-surface">
            Energy intelligence for smarter buildings.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-outline max-w-2xl mx-auto">
            Understand your building&apos;s energy, respond to peaks, and make better everyday decisions.
          </p>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-outline">
            Continue as
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-5">
          <article className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-5 sm:p-7 shadow-sm flex flex-col">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">domain</span>
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Facility Manager
            </p>
            <h2 className="mt-1 text-xl font-bold text-on-surface">Manage building intelligence</h2>
            <p className="mt-2 text-sm text-outline flex-1">
              Monitor building demand, peaks, flexibility and energy intelligence.
            </p>
            <button
              type="button"
              className="mt-6 min-h-12 w-full rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary-container transition-colors"
              onClick={() => onContinue('manager')}
            >
              Continue as Facility Manager
              <span className="material-symbols-outlined align-middle text-[18px] ml-2">arrow_forward</span>
            </button>
          </article>

          <article className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-5 sm:p-7 shadow-sm flex flex-col">
            <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">home</span>
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
              Occupant / Owner
            </p>
            <h2 className="mt-1 text-xl font-bold text-on-surface">Understand your home&apos;s energy context</h2>
            <p className="mt-2 text-sm text-outline flex-1">
              Get building-level energy insights, recommendations and peak alerts for your home.
            </p>
            <button
              type="button"
              className="mt-6 min-h-12 w-full rounded-xl border border-surface-container-high bg-surface-container-low text-on-surface text-sm font-bold hover:bg-surface-container transition-colors"
              onClick={() => onContinue('occupant')}
            >
              Continue as Occupant / Owner
              <span className="material-symbols-outlined align-middle text-[18px] ml-2">arrow_forward</span>
            </button>
          </article>
        </div>

        <p className="mt-6 text-center text-[11px] text-outline">
          MVP Demo · No production authentication is configured
        </p>
      </div>
    </main>
  );
}

function EntryForm({
  role,
  buildingHint,
  onBack,
  onSubmit,
}: {
  role: AccountRole;
  buildingHint: string;
  onBack: () => void;
  onSubmit: (profile: ManagerProfile | OccupantProfile) => void;
}) {
  const isManager = role === 'manager';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [identity, setIdentity] = useState('');
  const [building, setBuilding] = useState(buildingHint);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [residentType, setResidentType] = useState('');
  const [notificationPreference, setNotificationPreference] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isManager) {
      onSubmit({
        name: name.trim(),
        workEmail: email.trim(),
        managerId: identity.trim(),
        facility: (building || buildingHint).trim(),
        phone: phone.trim(),
      });
      return;
    }
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      building: (building || buildingHint).trim(),
      flatNumber: identity.trim(),
      residentType,
      notificationPreference,
    });
  };

  const inputClass = 'w-full min-h-11 px-3 rounded-lg bg-white border border-surface-container-high text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

  return (
    <main className="min-h-screen bg-surface px-4 py-8 sm:px-8 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-1 text-xs font-semibold text-outline hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>

        <section className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-5 sm:p-8 shadow-sm">
          <Logo />
          <div className="mt-6">
            <span className="inline-flex px-2.5 py-1 rounded-full bg-tertiary-fixed text-tertiary text-[10px] font-bold uppercase tracking-wider">
              MVP Demo
            </span>
            <h1 className="mt-3 text-2xl font-bold text-on-surface">
              {isManager ? 'Facility Manager sign-in' : 'Occupant / Owner sign-in'}
            </h1>
            <p className="mt-2 text-xs text-outline">
              Demo profile only. This form does not authenticate against a production identity service.
            </p>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-xs font-semibold text-on-surface">
              Full Name
              <input className={`${inputClass} mt-1.5`} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
            </label>

            <label className="block text-xs font-semibold text-on-surface">
              {isManager ? 'Work Email' : 'Email Address'}
              <input className={`${inputClass} mt-1.5`} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isManager ? (
                <label className="block text-xs font-semibold text-on-surface">
                  Employee / Manager ID
                  <input className={`${inputClass} mt-1.5`} value={identity} onChange={(event) => setIdentity(event.target.value)} required />
                </label>
              ) : (
                <label className="block text-xs font-semibold text-on-surface">
                  Flat / Apartment Number
                  <input className={`${inputClass} mt-1.5`} value={identity} onChange={(event) => setIdentity(event.target.value)} autoComplete="address-line2" required />
                </label>
              )}
              <label className="block text-xs font-semibold text-on-surface">
                Phone Number
                <input className={`${inputClass} mt-1.5`} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required />
              </label>
            </div>

            <label className="block text-xs font-semibold text-on-surface">
              {isManager ? 'Facility / Building' : 'Building'}
              <input className={`${inputClass} mt-1.5`} value={building || buildingHint} onChange={(event) => setBuilding(event.target.value)} autoComplete="organization" required />
              {buildingHint && (
                <span className="block mt-1 text-[10px] font-normal text-outline">
                  Backend building context: {buildingHint}
                </span>
              )}
            </label>

            {!isManager && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-xs font-semibold text-on-surface">
                  Owner / Tenant (optional)
                  <select className={`${inputClass} mt-1.5`} value={residentType} onChange={(event) => setResidentType(event.target.value)}>
                    <option value="">Select if you wish</option>
                    <option value="Owner">Owner</option>
                    <option value="Tenant">Tenant</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-on-surface">
                  Preferred notification (optional)
                  <select className={`${inputClass} mt-1.5`} value={notificationPreference} onChange={(event) => setNotificationPreference(event.target.value)}>
                    <option value="">No preference</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                  </select>
                </label>
              </div>
            )}

            <label className="block text-xs font-semibold text-on-surface">
              Password
              <input className={`${inputClass} mt-1.5`} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required minLength={6} />
              <span className="block mt-1 text-[10px] font-normal text-outline">
                Demo-only input; password is not saved or verified.
              </span>
            </label>

            <button type="submit" className="w-full min-h-12 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary-container transition-colors">
              Continue
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>('welcome');
  const [role, setRole] = useState<AccountRole>('manager');
  const [managerProfile, setManagerProfile] = useState<ManagerProfile | null>(null);
  const [occupantProfile, setOccupantProfile] = useState<OccupantProfile | null>(null);
  const [buildingHint, setBuildingHint] = useState('');

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const stored = readStoredSession();
      if (stored) {
        setManagerProfile(stored.manager);
        setOccupantProfile(stored.occupant);
        setRole(stored.role);
        setScreen('dashboard');
      }
      setHydrated(true);
    }, 0);

    void getReplayStatus()
      .then((status) => setBuildingHint(status.building))
      .catch(() => setBuildingHint(''));
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  const persistSession = (
    nextRole: AccountRole,
    manager: ManagerProfile | null,
    occupant: OccupantProfile | null,
  ) => {
    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ role: nextRole, manager, occupant } satisfies StoredSession),
    );
    setManagerProfile(manager);
    setOccupantProfile(occupant);
    setRole(nextRole);
    setScreen('dashboard');
  };

  const requestRole = (requestedRole: AccountRole) => {
    const profile = requestedRole === 'manager' ? managerProfile : occupantProfile;
    if (profile) {
      const session: StoredSession = {
        role: requestedRole,
        manager: managerProfile,
        occupant: occupantProfile,
      };
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setRole(requestedRole);
      setScreen('dashboard');
      return;
    }
    setRole(requestedRole);
    setScreen(requestedRole === 'manager' ? 'manager-form' : 'occupant-form');
  };

  const handleEntry = (profile: ManagerProfile | OccupantProfile) => {
    if (role === 'manager' && isManagerProfile(profile)) {
      persistSession('manager', profile, occupantProfile);
      return;
    }
    if (role === 'occupant' && isOccupantProfile(profile)) {
      persistSession('occupant', managerProfile, profile);
    }
  };

  const logout = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setManagerProfile(null);
    setOccupantProfile(null);
    setScreen('welcome');
    setRole('manager');
  };

  if (!hydrated) {
    return <main className="min-h-screen bg-surface flex items-center justify-center text-sm text-outline">Loading ENERSENSE…</main>;
  }

  if (screen === 'welcome') {
    return <WelcomeScreen onContinue={requestRole} />;
  }

  if (screen === 'manager-form' || screen === 'occupant-form') {
    const formRole = screen === 'manager-form' ? 'manager' : 'occupant';
    return (
      <EntryForm
        key={formRole}
        role={formRole}
        buildingHint={buildingHint}
        onBack={() => setScreen('welcome')}
        onSubmit={handleEntry}
      />
    );
  }

  if (role === 'manager' && managerProfile) {
    return (
      <FacilityManagerDashboard
        managerName={managerProfile.name}
        onSwitchRole={requestRole}
        onLogout={logout}
      />
    );
  }

  if (role === 'occupant' && occupantProfile) {
    return (
      <OccupantDashboard
        profile={occupantProfile}
        onSwitchRole={requestRole}
        onLogout={logout}
      />
    );
  }

  return <WelcomeScreen onContinue={requestRole} />;
}
