import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot
} from 'firebase/firestore';
import { 
  LayoutGrid, 
  GraduationCap, 
  ArrowLeft, 
  Search
} from 'lucide-react';

/* ================= FIREBASE CONFIG ================= */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= APP ================= */

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      await signInAnonymously(auth);
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            role: 'student'
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const coursesCol = collection(db, 'courses');

    const unsubscribe = onSnapshot(coursesCol, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(docs);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredCourses = courses.filter(c =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#080f1e] text-white flex">
      
      <aside className="w-64 bg-[#0b1426] p-6">
        <div className="flex items-center gap-2 mb-10">
          <GraduationCap className="text-[#00bf63]" size={28} />
          <h1 className="font-black uppercase">Diego Academy</h1>
        </div>

        <button 
          onClick={() => setView('home')}
          className="flex items-center gap-2 p-3 rounded-lg hover:bg-white/5 w-full"
        >
          <LayoutGrid size={18}/> Cursos
        </button>
      </aside>

      <main className="flex-1 p-10">
        
        {view === 'home' && (
          <>
            <h2 className="text-3xl font-black mb-6">
              Tu aprendizaje comienza aquí
            </h2>

            <div className="mb-8 max-w-md flex items-center bg-white/5 p-3 rounded-lg">
              <Search size={18} className="mr-2"/>
              <input 
                className="bg-transparent outline-none w-full"
                placeholder="Buscar curso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => (
                <div 
                  key={course.id}
                  onClick={() => {
                    setSelectedCourse(course);
                    setView('course');
                  }}
                  className="bg-[#0b1426] p-6 rounded-xl cursor-pointer hover:border hover:border-[#00bf63]"
                >
                  <h3 className="font-bold text-lg mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {course.description}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {view === 'course' && selectedCourse && (
          <div>
            <button 
              onClick={() => setView('home')}
              className="flex items-center gap-2 mb-6 text-sm"
            >
              <ArrowLeft size={16}/> Volver
            </button>

            <h2 className="text-3xl font-black mb-4">
              {selectedCourse.title}
            </h2>

            <p className="text-slate-400">
              {selectedCourse.description}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
