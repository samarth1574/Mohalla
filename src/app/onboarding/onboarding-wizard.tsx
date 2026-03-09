"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Home, User, Check, Loader2, Sparkles, Building } from "lucide-react";
import { completeOnboardingAction, searchLocationsAction, getSocietiesInLocation } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";

interface LocationOption {
  id: string;
  placeName: string;
  locationData: {
    country: string;
    state: string;
    city: string;
    area: string;
    pincode: string;
    latitude: number;
    longitude: number;
  };
}

interface SocietyOption {
  id: string;
  name: string;
  description: string | null;
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Profile data
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");

  // Location search state
  const [locSearch, setLocSearch] = useState("");
  const [locSuggestions, setLocSuggestions] = useState<LocationOption[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<LocationOption | null>(null);
  const [searchingLoc, setSearchingLoc] = useState(false);

  // Society state
  const [societies, setSocieties] = useState<SocietyOption[]>([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState("");
  const [createNewSociety, setCreateNewSociety] = useState(false);
  const [societyName, setSocietyName] = useState("");
  const [societyDescription, setSocietyDescription] = useState("");

  // Address search debounce
  useEffect(() => {
    if (locSearch.length < 3) {
      setLocSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchingLoc(true);
      try {
        const results = await searchLocationsAction(locSearch);
        setLocSuggestions(results as LocationOption[]);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingLoc(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [locSearch]);

  // Fetch societies when location is selected
  useEffect(() => {
    if (!selectedLoc) return;
    const fetchSocieties = async () => {
      const results = await getSocietiesInLocation(selectedLoc.locationData.pincode);
      setSocieties(results);
      if (results.length > 0) {
        setSelectedSocietyId(results[0].id);
      } else {
        setCreateNewSociety(true);
      }
    };
    fetchSocieties();
  }, [selectedLoc]);

  const handleNext = () => {
    if (step === 1 && !name.trim()) return;
    if (step === 2 && !selectedLoc) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoc) return;

    setLoading(true);
    try {
      await completeOnboardingAction({
        name,
        bio,
        avatar,
        location: selectedLoc.locationData,
        societyId: createNewSociety ? undefined : selectedSocietyId,
        societyName: createNewSociety ? societyName : undefined,
        createNewSociety,
        societyDescription: createNewSociety ? societyDescription : undefined,
      });
      router.push("/feed");
    } catch (err) {
      console.error(err);
      alert("Something went wrong during onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step transitions config
  const slideVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div className="w-full max-w-xl p-8 rounded-3xl border border-white/10 bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Info */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center gap-2 mb-2 text-emerald-500 font-semibold tracking-wide uppercase text-xs">
          <Sparkles className="w-4 h-4" />
          <span>Setup your neighborhood profile</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
          Welcome to Mohalla
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
          Step {step} of 3 — Let's personalize your community dashboard.
        </p>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/10 dark:bg-zinc-800 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-500/40 flex items-center justify-center bg-emerald-500/5 relative group cursor-pointer overflow-hidden transition hover:border-emerald-500">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-emerald-500/70" />
                  )}
                  <input
                    type="text"
                    placeholder="Paste image URL"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    title="Avatar URL"
                  />
                </div>
                <span className="text-xs text-slate-400 dark:text-zinc-500 mt-2">
                  Click/tap to paste an avatar image link
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-zinc-300">
                  What is your name?
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samarth Shekhar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/10 dark:bg-zinc-800/50 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-zinc-300">
                  Introduce yourself to the neighborhood (Bio)
                </label>
                <textarea
                  placeholder="Tell your neighbors about yourself (interests, hobby clubs you run, or local business you own)..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/10 dark:bg-zinc-800/50 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!name.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-zinc-300">
                  Search your Local Area / Pincode
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter locality, sector or pincode (e.g. Koramangala 560034)"
                    value={locSearch}
                    onChange={(e) => {
                      setLocSearch(e.target.value);
                      if (selectedLoc) setSelectedLoc(null);
                    }}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-white/10 dark:bg-zinc-800/50 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                  {searchingLoc && (
                    <Loader2 className="absolute right-4 top-3.5 w-5 h-5 animate-spin text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Suggestions List */}
              {locSuggestions.length > 0 && !selectedLoc && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-white/5 bg-white/10 dark:bg-zinc-800/90 rounded-2xl overflow-hidden divide-y divide-white/5 max-h-48 overflow-y-auto"
                >
                  {locSuggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedLoc(item);
                        setLocSearch(item.placeName);
                        setLocSuggestions([]);
                      }}
                      className="px-4 py-3 cursor-pointer hover:bg-emerald-500/10 transition flex items-center gap-3 text-sm dark:text-zinc-200"
                    >
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{item.placeName}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Selected location feedback card */}
              {selectedLoc && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold dark:text-zinc-200">
                        {selectedLoc.locationData.area || "Neighborhood Selected"}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        {selectedLoc.locationData.city}, {selectedLoc.locationData.state} ({selectedLoc.locationData.pincode})
                      </p>
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Check className="w-4 h-4" />
                  </div>
                </motion.div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-700 dark:text-zinc-300 font-semibold transition"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!selectedLoc}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex gap-3 text-sm text-slate-600 dark:text-zinc-300 mb-4">
                <Building className="w-5 h-5 text-emerald-500 shrink-0" />
                <p>
                  Connecting to a specific <strong>Society</strong> unlocks private feeds, announcements, security notices, and chat lines reserved only for verified residents.
                </p>
              </div>

              {societies.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-zinc-300">
                    Existing Societies in your area
                  </label>
                  <div className="grid gap-3">
                    {societies.map((soc) => (
                      <div
                        key={soc.id}
                        onClick={() => {
                          setCreateNewSociety(false);
                          setSelectedSocietyId(soc.id);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          !createNewSociety && selectedSocietyId === soc.id
                            ? "bg-emerald-500/10 border-emerald-500"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Home className="w-5 h-5 text-emerald-500" />
                          <div className="text-left">
                            <h4 className="text-sm font-bold dark:text-zinc-200">{soc.name}</h4>
                            {soc.description && (
                              <p className="text-xs text-zinc-500 mt-0.5">{soc.description}</p>
                            )}
                          </div>
                        </div>
                        {!createNewSociety && selectedSocietyId === soc.id && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Button/Card to trigger custom society creation */}
                    <div
                      onClick={() => setCreateNewSociety(true)}
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        createNewSociety
                          ? "bg-emerald-500/10 border-emerald-500"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-emerald-500" />
                        <div className="text-left">
                          <h4 className="text-sm font-bold dark:text-zinc-200">
                            Register a new Society / Apartment
                          </h4>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Can't find yours? Register it as a first-class community entity.
                          </p>
                        </div>
                      </div>
                      {createNewSociety && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Custom society creation form fields */}
              {(createNewSociety || societies.length === 0) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="space-y-4 pt-2 border-t border-white/5"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-zinc-300">
                      Society/Complex Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Prestige Lakeside, DLF Phase 3"
                      value={societyName}
                      onChange={(e) => setSocietyName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/10 dark:bg-zinc-800/50 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-zinc-300">
                      Brief Description / Landmark
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Opposite Forum Mall, gated high-rise society"
                      value={societyDescription}
                      onChange={(e) => setSocietyDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/10 dark:bg-zinc-800/50 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </motion.div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-700 dark:text-zinc-300 font-semibold transition"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading || (createNewSociety && !societyName.trim())}
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Completing...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Profile</span>
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
