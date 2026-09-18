export default function SetupNotice() {
  return (
    <main className="setup">
      <h1>Almost there</h1>
      <p>The app cannot reach its database yet. Add these two environment variables, then redeploy:</p>
      <pre>VITE_SUPABASE_URL{"\n"}VITE_SUPABASE_ANON_KEY</pre>
      <p>On Vercel they go under Project Settings › Environment Variables. The README explains where to find the values in Supabase.</p>
    </main>
  );
}
