
const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf-8");

// Add staffPin and staffInfo state
if (!content.includes("const [staffPin, setStaffPin]")) {
    content = content.replace(
        "const [authError, setAuthError] = useState(\"\");",
        "const [authError, setAuthError] = useState(\"\");\n    const [staffPin, setStaffPin] = useState(\"\");\n    const [staffInfo, setStaffInfo] = useState(\"\");"
    );
}

// Add staff inputs to the UI
if (!content.includes("Staff PIN (Required for Staff Role)")) {
    const uiTarget = `<div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Email Address</label>`;
                  
    const uiReplacement = `{signupRole === "staff" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Staff PIN (Required for Staff Role)</label>
                      <input
                        type="text"
                        placeholder="6-Digit Shop PIN"
                        value={staffPin}
                        onChange={(e) => setStaffPin(e.target.value)}
                        className="w-full bg-white border border-emerald-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Your Role / Details (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Delivery Driver, Sous Chef"
                        value={staffInfo}
                        onChange={(e) => setStaffInfo(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                      />
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Email Address</label>`;
                  
    content = content.replace(uiTarget, uiReplacement);
}

// Modify signup flow to call /api/users/link-shop if staff
if (!content.includes("if (signupRole === \"staff\") {")) {
    const submitTarget = `await mongoService.saveUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name,
          role: signupRole
        });`;
        
    const submitReplacement = `await mongoService.saveUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name,
          role: signupRole
        });
        
        if (signupRole === "staff") {
          const res = await fetch("/api/users/link-shop", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: \`Bearer \${await userCredential.user.getIdToken()}\`
            },
            body: JSON.stringify({ pin: staffPin, staffInfo, name })
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to link shop PIN");
          }
        }`;
        
    content = content.replace(submitTarget, submitReplacement);
}

fs.writeFileSync("src/App.tsx", content);
console.log("App login patched.");

