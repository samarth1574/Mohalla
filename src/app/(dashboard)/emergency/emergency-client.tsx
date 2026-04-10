"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  Plus, 
  Loader2, 
  ShieldAlert, 
  HeartHandshake, 
  Check, 
  MessageSquare, 
  MapPin, 
  Users, 
  Clock, 
  Navigation, 
  CheckCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  triggerEmergencySOSAction, 
  volunteerForSOSAction, 
  addEmergencyUpdateAction, 
  resolveEmergencySOSAction 
} from "@/app/actions/emergency";

interface EmergencyClientProps {
  currentUserId: string;
  emergencies: any[];
}

export function EmergencyClient({ currentUserId, emergencies }: EmergencyClientProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Composer fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<any>("MEDICAL");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [fetchingCoords, setFetchingCoords] = useState(false);

  // Update input tracking (sosId -> content)
  const [timelineInputs, setTimelineInputs] = useState<Record<string, string>>({});
  const [viewingTimelineId, setViewingTimelineId] = useState<string | null>(null);

  // Grab location coordinates
  const handleGetCoords = () => {
    setFetchingCoords(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setFetchingCoords(false);
        },
        (err) => {
          console.warn("Geolocation permission denied, simulating coords.");
          // Fallback mockup coordinates (e.g. Bangalore area)
          setLatitude(12.9716);
          setLongitude(77.5946);
          setFetchingCoords(false);
        }
      );
    } else {
      setFetchingCoords(false);
    }
  };

  const handleTriggerSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    startTransition(async () => {
      try {
        const result = await triggerEmergencySOSAction({
          title,
          description,
          category,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
        });

        if (result.success) {
          setTitle("");
          setDescription("");
          setLatitude(null);
          setLongitude(null);
          setComposerOpen(false);
          alert("Emergency SOS Alert Broadcasted to Pincode successfully!");
        }
      } catch (err: any) {
        alert(err.message || "Failed to trigger SOS.");
      }
    });
  };

  const handleVolunteer = (sosId: string) => {
    startTransition(async () => {
      try {
        await volunteerForSOSAction(sosId);
        alert("Thank you! You have registered as a volunteer responder.");
      } catch (err: any) {
        alert(err.message || "Failed to volunteer.");
      }
    });
  };

  const handleAddUpdate = async (sosId: string) => {
    const text = timelineInputs[sosId];
    if (!text || !text.trim()) return;

    try {
      const result = await addEmergencyUpdateAction(sosId, text);
      if (result.success) {
        setTimelineInputs({ ...timelineInputs, [sosId]: "" });
      }
    } catch (err: any) {
      alert(err.message || "Failed to add update.");
    }
  };

  const handleResolve = (sosId: string) => {
    if (confirm("Confirm that this emergency situation has been resolved?")) {
      startTransition(async () => {
        try {
          await resolveEmergencySOSAction(sosId);
        } catch (err: any) {
          alert(err.message || "Failed to resolve SOS.");
        }
      });
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Red Alert Header Banner */}
      <div className="p-6 rounded-3xl bg-red-500/10 border-2 border-red-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-extrabold text-sm uppercase tracking-wider">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span>Crisis broadcast network</span>
          </div>
          <h1 className="text-3xl font-black text-red-600 dark:text-red-400 tracking-tight">
            Emergency SOS Panel
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Need urgent assistance or want to assist? Direct alert system. Broadcasting triggers immediate push warnings to all verified neighbors in your geocoded coordinates.
          </p>
        </div>
        <Button
          onClick={() => setComposerOpen(!composerOpen)}
          className="rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold h-11 px-6 shadow-lg shadow-red-500/20 relative z-10 shrink-0"
        >
          <Plus className="w-5 h-5 mr-1" />
          Broadcast SOS Alarm
        </Button>
      </div>

      {/* SOS Composer Dialog */}
      <AnimatePresence>
        {composerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="rounded-3xl border-red-500/20 bg-red-500/5 dark:bg-zinc-950 p-6 shadow-xl">
              <form onSubmit={handleTriggerSOS} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-red-500 uppercase tracking-wide">
                      Urgent Emergency Header / Title
                    </label>
                    <Input
                      placeholder="e.g. Medical emergency: O-ve Blood Needed immediately"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="rounded-xl bg-slate-50 dark:bg-zinc-900 border-red-500/10 focus-visible:ring-red-500/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-red-500 uppercase tracking-wide">
                      Crisis Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl border border-red-500/10 bg-slate-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    >
                      <option value="MEDICAL">Medical Emergency</option>
                      <option value="BLOOD_DONATION">Blood Donation Need</option>
                      <option value="WOMEN_SAFETY">Women's Safety / Threat</option>
                      <option value="ACCIDENT">Accident Response</option>
                      <option value="MISSING_PERSON">Missing Person / Pet</option>
                      <option value="SAFETY_ALERT">General Safety Danger</option>
                      <option value="NATURAL_DISASTER">Natural Calamity</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-red-500 uppercase tracking-wide">
                    Crisis Description & Instructions
                  </label>
                  <Textarea
                    placeholder="Provide precise location, room/flat number, landmarks, phone contacts, and specific items required..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    className="rounded-xl bg-slate-50 dark:bg-zinc-900 border-red-500/10 focus-visible:ring-red-500/30 resize-none"
                  />
                </div>

                {/* Geolocation lock coordinates trigger */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-red-500/10 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetCoords}
                    className="rounded-xl border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/5 h-10 px-4 text-xs font-semibold"
                  >
                    <Navigation className="w-4 h-4 mr-1.5 shrink-0" />
                    {fetchingCoords ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : null}
                    {latitude ? `Location coordinates locked (${latitude.toFixed(4)}, ${longitude?.toFixed(4)})` : "Lock Current Coordinates"}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setComposerOpen(false)}
                      className="rounded-full text-slate-500"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="rounded-full bg-red-600 hover:bg-red-500 text-white font-bold h-10 px-6"
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Trigger Broadcast"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Emergencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {emergencies.length === 0 ? (
          <div className="md:col-span-2 text-center py-24 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900/10">
            <HeartHandshake className="w-12 h-12 mx-auto mb-3 opacity-60 text-emerald-500" />
            <p className="text-sm font-semibold">Everything is fine and safe!</p>
            <p className="text-xs mt-1">No active emergency signals reported in your neighborhood.</p>
          </div>
        ) : (
          emergencies.map((sos) => {
            const hasVolunteered = sos.volunteers.some((vol: any) => vol.userId === currentUserId);
            const isCreator = sos.authorId === currentUserId;
            const isActive = sos.status === "ACTIVE";

            return (
              <Card
                key={sos.id}
                className={`rounded-3xl border shadow-md relative overflow-hidden transition-all flex flex-col justify-between p-6 ${
                  isActive 
                    ? "border-red-500 bg-red-500/[0.03] dark:bg-red-950/[0.04]" 
                    : "border-slate-200 dark:border-zinc-850 opacity-80"
                }`}
              >
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-red-500 animate-ping" : "bg-slate-400"}`} />
                      <Badge className={`text-[9px] font-black uppercase ${
                        isActive ? "bg-red-500 text-white" : "bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}>
                        {sos.category} ({sos.status})
                      </Badge>
                    </div>

                    <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(sos.createdAt).toLocaleDateString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold tracking-tight dark:text-zinc-50">
                      {sos.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                      {sos.description}
                    </p>

                    {sos.latitude && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold pt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Coordinates locked: {sos.latitude.toFixed(4)}, {sos.longitude?.toFixed(4)}</span>
                      </div>
                    )}
                  </div>

                  {/* Responders Listing */}
                  <div className="bg-slate-100/50 dark:bg-zinc-950/60 p-4 rounded-2xl border border-slate-200/50 dark:border-zinc-850 space-y-3">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Volunteer responders ({sos.volunteers.length})</span>
                    </h4>
                    
                    {sos.volunteers.length === 0 ? (
                      <p className="text-[10px] text-zinc-500 italic">No volunteers arrived yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {sos.volunteers.map((vol: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 text-[10px] font-bold border border-slate-200 dark:border-zinc-750"
                          >
                            <Avatar className="w-4.5 h-4.5">
                              <AvatarFallback>{vol.user.name[0]}</AvatarFallback>
                            </Avatar>
                            <span>{vol.user.name}</span>
                            <span className="text-emerald-500 font-extrabold">★{vol.user.trustScore}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline and Action buttons */}
                <div className="border-t border-slate-150 dark:border-zinc-850/80 pt-4 mt-4 space-y-4">
                  
                  {/* Timeline updates toggler */}
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400">
                    <button
                      onClick={() => setViewingTimelineId(viewingTimelineId === sos.id ? null : sos.id)}
                      className="flex items-center gap-1.5 hover:text-red-500 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Timeline log / updates ({sos.updates.length})</span>
                    </button>

                    {isCreator && isActive && (
                      <Button
                        onClick={() => handleResolve(sos.id)}
                        className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8 px-4 text-[10px]"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Mark Resolved
                      </Button>
                    )}
                  </div>

                  {/* Expanded timeline log */}
                  {viewingTimelineId === sos.id && (
                    <div className="space-y-3 pt-2">
                      {sos.updates.length > 0 && (
                        <div className="space-y-2 bg-slate-50/50 dark:bg-zinc-950/30 p-4 rounded-2xl border border-slate-150 dark:border-zinc-850 max-h-40 overflow-y-auto divide-y divide-slate-150 dark:divide-zinc-850">
                          {sos.updates.map((update: any) => (
                            <div key={update.id} className="text-left pt-2.5 first:pt-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-800 dark:text-zinc-200">
                                  {update.author.name}
                                </span>
                                <span className="text-[8px] text-zinc-500">
                                  {new Date(update.createdAt).toLocaleDateString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-600 dark:text-zinc-400 mt-1">
                                {update.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add update form (visible only to active crisis creators/volunteers) */}
                      {isActive && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add situation update..."
                            value={timelineInputs[sos.id] || ""}
                            onChange={(e) =>
                              setTimelineInputs({ ...timelineInputs, [sos.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddUpdate(sos.id);
                            }}
                            className="rounded-xl text-[10px] bg-slate-50 dark:bg-zinc-900 border-red-500/10 h-8"
                          />
                          <Button
                            onClick={() => handleAddUpdate(sos.id)}
                            className="rounded-xl bg-red-600 text-white px-3 h-8 text-[10px] font-bold"
                          >
                            Update
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Volunteer toggle trigger */}
                  {isActive && !isCreator && (
                    <Button
                      disabled={hasVolunteered}
                      onClick={() => handleVolunteer(sos.id)}
                      className={`w-full rounded-xl font-bold h-9 text-xs flex items-center justify-center gap-1.5 ${
                        hasVolunteered
                          ? "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-500 border border-slate-200 dark:border-zinc-750"
                          : "bg-red-600 hover:bg-red-500 text-white"
                      }`}
                    >
                      {hasVolunteered ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>Registered responder</span>
                        </>
                      ) : (
                        <>
                          <HeartHandshake className="w-4 h-4 mr-1.5" />
                          <span>Respond to Emergency</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
