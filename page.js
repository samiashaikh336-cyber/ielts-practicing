"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, doc, query, orderBy, addDoc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../lib/firebaseClient";
import { useAuth } from "../../context/AuthContext";



const TOPICS = ["Free conversation", "IELTS Speaking Part 2", "Travel stories", "Movies & TV", "Work & career", "Daily life"];

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "queue", user.uid), (snap) => {
      const data = snap.data();
      if (data?.status === "matched" && data.roomId) {
        router.push(`/room/${data.roomId}`);
      }
    });
    return () => unsub();
  }, [user, router]);

  useEffect(() => {
    const q = query(collection(db, "topicRooms"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  async function joinInstant() {
    setSearching(true);
    await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, displayName: profile?.displayName, country: profile?.country }),
    });
  }

  async function cancelSearch() {
    setSearching(false);
    await fetch("/api/match", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid }),
    });
  }

  async function createTopicRoom() {
    setCreating(true);
    try {
      const res = await fetch("/api/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: `topic-${Date.now()}`, maxParticipants: 5 }),
      });
      const room = await res.json();
      const memberEntry = { uid: user.uid, displayName: profile?.displayName, country: profile?.country };

      await setDoc(doc(db, "rooms", room.name), {
        type: "topic",
        dailyUrl: room.url,
        dailyToken: room.token,
        topic,
        members: [memberEntry],
        createdAt: Date.now(),
      });

      await addDoc(collection(db, "topicRooms"), {
        topic,
        roomName: room.name,
        maxParticipants: 5,
        members: [memberEntry],
        createdAt: serverTimestamp(),
      });
      router.push(`/room/${room.name}?topicRoomJoin=1`);
    } finally {
      setCreating(false);
    }
  }

  async function joinTopicRoom(room) {
    if (room.members.length >= room.maxParticipants) return;
    const memberEntry = { uid: user.uid, displayName: profile?.displayName, country: profile?.country };
    await updateDoc(doc(db, "topicRooms", room.id), { members: arrayUnion(memberEntry) });
    await updateDoc(doc(db, "rooms", room.roomName), { members: arrayUnion(memberEntry) });
    router.push(`/room/${room.roomName}`);
  }

  if (loading || !user) return null;

  return (
    <main className="min-h-screen bg-[#0F172A] text-[#F8FAFC] font-sans antialiased">
      {/* Top Navigation Bar */}
      <nav className="border-b border-[#334155] bg-[#1E293B] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 bg-[#10B981]" />
            <span className="font-mono text-sm font-bold tracking-wider text-[#94A3B8]">IELTS_CORE_WORKSPACE</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs text-[#94A3B8]">ID: {profile?.displayName || "Learner"} ({profile?.country || "Global"})</span>
            <button 
              onClick={() => signOut(auth)} 
              className="border border-[#334155] bg-[#0F172A] px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-white hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors"
            >
              DISCONNECT
            </button>
          </div>
        </div>
      </nav>

      {/* Control Grid Layout */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-6 lg:grid-cols-12">
        
        {/* Left Hand Inputs Column */}
        <div className="space-y-6 lg:col-span-5">
          {/* Module 1: Instant Group Matrix Match */}
          <section className="border border-[#334155] bg-[#1E293B] p-6">
            <h2 className="text-xs font-bold tracking-widest text-[#94A3B8] uppercase">01 // Peer Match Queue</h2>
            <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
              Triggers a dynamic transaction loop to pair your terminal parameter with two online learners instantly.
            </p>
            {!searching ? (
              <button
                onClick={joinInstant}
                className="mt-6 w-full bg-[#2563EB] py-3 text-xs font-mono font-bold tracking-widest uppercase text-white hover:bg-[#2563EB]/90 transition-colors"
              >
                INITIALIZE INSTANT MATCH
              </button>
            ) : (
              <div className="mt-6 border border-[#334155] bg-[#0F172A] p-4 flex flex-col items-center justify-center gap-2">
                <div className="h-1 w-full bg-[#334155] overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 left-0 bg-[#10B981] w-1/3 animate-infinite-loading" />
                </div>
                <span className="text-[11px] font-mono text-[#10B981] mt-2">WAITING FOR PEER HANDSHAKE...</span>
                <button onClick={cancelSearch} className="text-xs text-[#EF4444] font-mono hover:underline mt-1">
                  ABORT QUEUE TRANSACTION
                </button>
              </div>
            )}
          </section>

          {/* Module 2: Dedicated Session Generation */}
          <section className="border border-[#334155] bg-[#1E293B] p-6">
            <h2 className="text-xs font-bold tracking-widest text-[#94A3B8] uppercase">02 // Provision Topic Module</h2>
            <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
              Select a specialized focus context rule and establish a public token room router.
            </p>
            <div className="mt-4 space-y-3">
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full border border-[#334155] bg-[#0F172A] px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={createTopicRoom}
                disabled={creating}
                className="w-full bg-[#10B981] py-3 text-xs font-mono font-bold tracking-widest uppercase text-white hover:bg-[#10B981]/90 disabled:opacity-40 transition-colors"
              >
                {creating ? "PROVISIONING..." : "DEPLOY MODULE CHANNEL"}
              </button>
            </div>
          </section>
        </div>

        {/* Right Hand Public Channels Display */}
        <section className="border border-[#334155] bg-[#1E293B] p-6 lg:col-span-7">
          <h2 className="text-xs font-bold tracking-widest text-[#94A3B8] uppercase">03 // Active Public Terminals</h2>
          <div className="mt-6 space-y-3">
            {rooms.length === 0 && (
              <div className="border border-dashed border-[#334155] p-8 text-center text-xs text-[#94A3B8] font-mono">
                NO ACTIVE CHANNELS FOUND. PROVISION ONE ABOVE TO COMMENCE.
              </div>
            )}
            {rooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between border border-[#334155] bg-[#0F172A] p-4">
                <div>
                  <span className="text-xs font-bold text-[#F8FAFC]">{room.topic}</span>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-[#94A3B8] font-mono">
                    <span>CAPACITY MODULE: {room.members?.length || 0}/{room.maxParticipants} INDIVIDUALS</span>
                  </div>
                </div>
                <button
                  onClick={() => joinTopicRoom(room)}
                  disabled={room.members?.length >= room.maxParticipants}
                  className="border border-[#334155] bg-[#1E293B] px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#10B981] hover:bg-[#10B981] hover:text-white disabled:opacity-30 transition-all"
                >
                  {room.members?.length >= room.maxParticipants ? "FULL" : "CONNECT"}
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
