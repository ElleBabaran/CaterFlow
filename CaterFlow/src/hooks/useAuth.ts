import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { WorkspaceRole } from '../types';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [signupRole, setSignupRole] = useState<WorkspaceRole>('customer');
  const [authError, setAuthError] = useState<string | null>(null);
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole>('customer');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await fetch(`/api/users/${user.uid}`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data?.role) {
              setWorkspaceRole(data.role as WorkspaceRole);
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const saveUserProfile = async (userObj: any, role: string) => {
    try {
      const token = await userObj.getIdToken();
      await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userObj.email,
          name: userObj.displayName || name,
          role,
          photoURL: userObj.photoURL
        })
      });
      setWorkspaceRole(role as WorkspaceRole);
    } catch (err) {
      console.error("Failed to save user profile:", err);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await saveUserProfile(result.user, signupRole);
    } catch (error: any) {
      console.error(error);
      setAuthError(error.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserProfile(userCredential.user, signupRole);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await saveUserProfile(result.user, 'customer');
      }
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const logout = () => {
    signOut(auth);
  };

  return {
    user,
    loading,
    authMode,
    setAuthMode,
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    signupRole,
    setSignupRole,
    authError,
    workspaceRole,
    signInWithGoogle,
    handleEmailAuth,
    logout
  };
}
